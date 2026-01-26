from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.db import transaction
from .models import Barbershop, UserProfile, Barber
import secrets
import string

# Mapeamento de IDs de produtos do Cacto para Planos Internos
# O usuário deve preencher com os IDs reais configurados no Cacto
CACTO_PLAN_MAPPING = {
    'prod_basico_id': 'BASIC',
    'prod_equipe_id': 'TEAM',
    'prod_pro_id': 'PRO',
}

@api_view(['POST'])
@permission_classes([AllowAny])
def cacto_webhook(request):
    """
    Webhook para receber notificações de pagamento do Cacto.
    Cria o usuário e a barbearia após a confirmação do pagamento.
    """
    data = request.data

    # Exemplo de verificação de status (ajuste conforme a documentação do Cacto)
    # Procuramos recursivamente por campos comuns que indiquem status/pagamento
    def find_key_recursive(obj, key):
        if isinstance(obj, dict):
            if key in obj:
                return obj[key]
            for v in obj.values():
                res = find_key_recursive(v, key)
                if res is not None:
                    return res
        elif isinstance(obj, list):
            for item in obj:
                res = find_key_recursive(item, key)
                if res is not None:
                    return res
        return None

    # Try multiple possible keys and shapes
    payment_status = (
        find_key_recursive(data, 'status') or
        find_key_recursive(data, 'payment_status') or
        find_key_recursive(data, 'state') or
        find_key_recursive(data, 'paymentState') or
        (True if find_key_recursive(data, 'paid') is True else None)
    )

    # normalize
    if isinstance(payment_status, str):
        payment_status = payment_status.lower()

    if not payment_status or (isinstance(payment_status, str) and payment_status not in ['paid', 'approved', 'completed']):
        print(f"Webhook recebido com status não pago: {payment_status}")
        print("Payload recebido para depuração:", data)
        return Response({"detail": "Pagamento não confirmado ou status ignorado"}, status=status.HTTP_200_OK)

    # Função utilitária para extrair email, nome, telefone e cpf/docNumber do payload
    def extract_customer_info(payload: dict):
        # tenta localizar um dict 'customer' em qualquer nível
        cust = find_key_recursive(payload, 'customer')
        if isinstance(cust, dict):
            email = cust.get('email')
            full_name = cust.get('name') or cust.get('full_name')
            phone = cust.get('phone') or cust.get('phone_number') or cust.get('mobile')
        else:
            # fallback: procurar chaves soltas
            email = find_key_recursive(payload, 'email')
            full_name = find_key_recursive(payload, 'name') or find_key_recursive(payload, 'full_name')
            phone = find_key_recursive(payload, 'phone') or find_key_recursive(payload, 'phone_number')

        # últimas tentativas para normalizar
        if isinstance(email, dict):
            email = None
        if isinstance(full_name, dict):
            full_name = None
        if isinstance(phone, dict):
            phone = None
        # cpf / docNumber
        cpf = find_key_recursive(payload, 'docNumber') or find_key_recursive(payload, 'cpf') or find_key_recursive(payload, 'document')
        if isinstance(cpf, dict):
            cpf = None

        return email, full_name, phone, cpf

    email, full_name, phone, cpf = extract_customer_info(data)

    # product id: tenta extrair o dict 'product' e pegar seu id
    prod = find_key_recursive(data, 'product')
    product_id = None
    if isinstance(prod, dict):
        product_id = prod.get('id') or prod.get('short_id')
    # fallbacks
    if not product_id:
        product_id = data.get('product_id') or (data.get('data', {}) or {}).get('product_id')
    if product_id is not None:
        product_id = str(product_id)

    if not email:
        print(f"Webhook sem email válido: payload={data}")
        return Response({"error": "Email do cliente não encontrado no payload"}, status=status.HTTP_400_BAD_REQUEST)

    plan = CACTO_PLAN_MAPPING.get(product_id, 'BASIC')

    try:
        with transaction.atomic():
            # 1. Verifica se usuário já existe
            if User.objects.filter(email=email).exists():
                print(f"Usuário já existe: {email}")
                return Response({"detail": "Usuário já registrado com este e-mail"}, status=status.HTTP_200_OK)

            # 2. Cria o Usuário
            # prefer phone as username (digits only) because users login with phone
            def only_digits(s):
                return ''.join([c for c in (s or '') if c.isdigit()])

            phone_digits = only_digits(phone) if phone else None
            if phone_digits:
                username = phone_digits[:30]
            else:
                username = slugify(email.split('@')[0])[:30]

            # Valida unicidade de username
            if User.objects.filter(username=username).exists():
                username = f"{username}_{secrets.token_hex(2)}"
            
            default_password = "Barber@Reset2026" # Senha padrão sugerida
            first_name = (full_name or '').split(' ')[0] if full_name else ''
            last_name = ' '.join((full_name or '').split(' ')[1:]) if full_name else ''

            user = User.objects.create_user(
                username=username,
                email=email,
                password=default_password,
                first_name=first_name,
                last_name=last_name
            )

            # 3. Cria o Perfil de Dono (salvando CPF se disponível)
            profile = UserProfile.objects.create(user=user, role='OWNER', cpf=cpf if cpf else None)

            # Não criar a barbearia aqui: o usuário será levado para a tela de registro
            # onde ele finalizará os dados da barbearia. Retornamos sucesso indicando
            # que o usuário foi criado e que a barbearia deve ser criada no fluxo de cadastro.
            print(f"Sucesso: Usuário {email} criado com plano {plan}. Senha: {default_password}")
            return Response({
                "message": "Usuário criado com sucesso; crie a barbearia no fluxo de registro",
                "username": username
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"Erro no Webhook Cacto: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
