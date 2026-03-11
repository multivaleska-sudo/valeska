export const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  if (!url) return "";

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(
        `HTTP Error: ${res.status} - No se pudo encontrar el recurso en: ${url}`,
      );
    }

    const blob = await res.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String);
      };

      reader.onerror = () => {
        console.error(`FileReader Error en la conversión de: ${url}`);
        reject(new Error("Error durante la lectura del Blob de imagen."));
      };

      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(" [ImageConverter Error]:", error);
    return "";
  }
};
