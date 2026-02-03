import sys
from PIL import Image, ImageOps
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

def compress_image(image, quality=70, max_width=800):
    """
    Comprime e redimensiona uma imagem para otimizar o carregamento.
    Corrige a orientação EXIF e usa JPEG Progressivo.
    """
    if not image:
        return None
    
    # Abre a imagem usando Pillow
    img = Image.open(image)

    # Corrige a orientação baseada no EXIF (evita imagem deitada)
    img = ImageOps.exif_transpose(img)
    
    # Converte RGBA para RGB se necessário (para JPG)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # Redimensiona proporcionalmente se for maior que max_width
    if img.width > max_width:
        ratio = max_width / float(img.width)
        height = int(float(img.height) * float(ratio))
        img = img.resize((max_width, height), Image.Resampling.LANCZOS)
    
    # Salva em um buffer BytesIO
    output = BytesIO()
    img.save(output, format='JPEG', quality=quality, optimize=True, progressive=True)
    output.seek(0)
    
    # Retorna como um arquivo Django pronto para ser salvo no ImageField
    return InMemoryUploadedFile(
        output,
        'ImageField',
        f"{image.name.split('.')[0]}.jpg",
        'image/jpeg',
        sys.getsizeof(output),
        None
    )
