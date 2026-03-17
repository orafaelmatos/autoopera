import qrcode
import base64
import unicodedata
import re
from io import BytesIO

class PixGenerator:
    def __init__(self, key, name, city, amount, reference_label):
        self.key = self._normalize_key(key)
        self.name = self._normalize_text(name, 25)
        self.city = self._normalize_text(city, 15)
        self.amount = "{:.2f}".format(float(amount))
        self.reference_label = self._normalize_reference(reference_label)

    def _normalize_key(self, key):
        if not key:
            return ""
        # Remove espaços e caracteres que nunca fazem parte de uma chave Pix
        # (como parênteses, asteriscos, etc)
        # Mantém apenas letras, números, @, ponto, hífen e o sinal + para telefones
        return re.sub(r'[^a-zA-Z0-9@.+-]', '', str(key)).strip()

    def _normalize_text(self, text, limit):
        if not text:
            return "NAO INFORMADO"[:limit]
        # Remove acentos
        text = "".join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')
        # Mantém apenas letras, números e espaços
        text = re.sub(r'[^a-zA-Z0-9 ]', '', text)
        return text.strip().upper()[:limit]

    def _normalize_reference(self, ref):
        if not ref:
            return "PAGA01"
        # Referência Pix não pode ter espaços ou caracteres especiais
        ref = "".join(c for c in unicodedata.normalize('NFD', ref) if unicodedata.category(c) != 'Mn')
        ref = re.sub(r'[^a-zA-Z0-9]', '', ref)
        # O ID da transação (62-05) deve ser curto e opcionalmente diferente de ***
        return ref[:25] or "PAGA01"

    def _format_field(self, id, value):
        size = str(len(str(value))).zfill(2)
        return f"{id}{size}{value}"

    def generate_payload(self):
        # 00: Payload Format Indicator (Fixo "01")
        payload = self._format_field("00", "01")
        
        # 01: Point of Initiation Method (11 = Estático, 12 = Dinâmico)
        # Bancos como Nubank/Itaú preferem 11 para chaves estáticas com valor.
        payload += self._format_field("01", "11")
        
        # 26: Merchant Account Information
        gui = self._format_field("00", "br.gov.bcb.pix")
        key = self._format_field("01", self.key)
        merchant_account = self._format_field("26", gui + key)
        payload += merchant_account
        
        # 52: Merchant Category Code (Fixo "0000")
        payload += self._format_field("52", "0000")
        
        # 53: Transaction Currency (986 = Real Brasileiro)
        payload += self._format_field("53", "986")
        
        # 54: Transaction Amount
        payload += self._format_field("54", self.amount)
        
        # 58: Country Code (BR)
        payload += self._format_field("58", "BR")
        
        # 59: Merchant Name (Máximo 25 caracteres)
        merchant_name = self.name if self.name else "BARBEARIA"
        payload += self._format_field("59", merchant_name[:25])
        
        # 60: Merchant City (Máximo 15 caracteres)
        merchant_city = self.city if self.city else "CIDADE"
        payload += self._format_field("60", merchant_city[:15])
        
        # 62: Additional Data Field Template
        # IMPORTANTE: No modo estático (11), o ID de transação deve ser curto ou "000"
        txid = self.reference_label[:25] if self.reference_label else "000"
        ref = self._format_field("05", txid)
        payload += self._format_field("62", ref)
        
        # 63: CRC16
        payload += "6304"
        payload += self._crc16(payload)
        
        return payload

    def _crc16(self, data):
        data = data.encode('ascii')
        crc = 0xFFFF
        polynomial = 0x1021
        for byte in data:
            crc ^= (byte << 8)
            for _ in range(8):
                if (crc & 0x8000):
                    crc = (crc << 1) ^ polynomial
                else:
                    crc <<= 1
                crc &= 0xFFFF
        return hex(crc).upper()[2:].zfill(4)

def generate_pix_qr_code(key, name, city, amount, reference_label):
    generator = PixGenerator(key, name, city, amount, reference_label)
    pix_code = generator.generate_payload()
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(pix_code)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return pix_code, f"data:image/png;base64,{img_str}"
