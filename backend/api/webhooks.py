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
    # Comumente: status="paid", "approved" ou similar
    payment_status = data.get('status') or data.get('payment_status')
    
    if payment_status not in ['paid', 'approved', 'completed']:
        return Response({"detail": "Pagamento não confirmado ou status ignorado"}, status=status.HTTP_200_OK)

    email = data.get('customer', {}).get('email')
    full_name = data.get('customer', {}).get('name', 'Barbeiro')
    product_id = str(data.get('product_id') or data.get('product', {}).get('id'))
    
    if not email:
        return Response({"error": "Email do cliente não encontrado no payload"}, status=status.HTTP_400_BAD_REQUEST)

    plan = CACTO_PLAN_MAPPING.get(product_id, 'BASIC')

    try:
        with transaction.atomic():
            # 1. Verifica se usuário já existe
            if User.objects.filter(email=email).exists():
                return Response({"detail": "Usuário já registrado com este e-mail"}, status=status.HTTP_200_OK)

            # 2. Cria o Usuário
            username = email.split('@')[0]
            # Valida unicidade de username
            if User.objects.filter(username=username).exists():
                username = f"{username}_{secrets.token_hex(2)}"
            
            default_password = "Barber@Reset2026" # Senha padrão sugerida
            user = User.objects.create_user(
                username=username,
                email=email,
                password=default_password,
                first_name=full_name.split(' ')[0],
                last_name=' '.join(full_name.split(' ')[1:])
            )

            # 3. Cria o Perfil de Dono
            UserProfile.objects.create(user=user, role='OWNER')

            # 4. Cria a Barbearia (Slug baseada no nome ou e-mail)
            shop_name = f"Barbearia de {user.first_name}"
            base_slug = slugify(shop_name)
            slug = base_slug
            counter = 1
            while Barbershop.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            barbershop = Barbershop.objects.create(
                name=shop_name,
                slug=slug,
                owner=user,
                plan=plan,
                is_active=True
            )

            # 5. Cria Perfil de Barbeiro inicial para o dono
            Barber.objects.create(
                user=user,
                barbershop=barbershop,
                name=user.get_full_name() or user.username,
                email=user.email,
                is_active=True
            )

            # Aqui você poderia disparar um e-mail para o cliente com as credenciais
            print(f"Sucesso: Usuário {email} criado com plano {plan}. Senha: {default_password}")

            return Response({
                "message": "Usuário e Barbearia criados com sucesso",
                "username": username,
                "slug": slug
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(f"Erro no Webhook Cacto: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
