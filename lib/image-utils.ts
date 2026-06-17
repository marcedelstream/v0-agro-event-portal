/**
 * Comprime y redimensiona una imagen antes de subirla
 * - Máximo 1200px de ancho (ideal para OG images)
 * - Calidad JPEG 0.85 (buen balance calidad/peso)
 * - Convierte cualquier formato a JPEG
 */
export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
  } = {}
): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Crear canvas y dibujar imagen redimensionada
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("No se pudo crear contexto de canvas"))
        return
      }

      // Fondo blanco (para transparencias PNG)
      ctx.fillStyle = "#FFFFFF"
      ctx.fillRect(0, 0, width, height)
      
      // Dibujar imagen
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir a blob JPEG
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al comprimir imagen"))
            return
          }
          
          // Crear nuevo File con nombre original pero extension .jpg
          const fileName = file.name.replace(/\.[^.]+$/, ".jpg")
          const compressedFile = new File([blob], fileName, {
            type: "image/jpeg",
            lastModified: Date.now(),
          })
          
          resolve(compressedFile)
        },
        "image/jpeg",
        quality
      )
    }

    img.onerror = () => reject(new Error("Error al cargar imagen"))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Comprime imagen específicamente para OG/redes sociales
 * Dimensiones ideales: 1200x630px
 */
export async function compressForOG(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 1200,
    maxHeight: 630,
    quality: 0.9,
  })
}
