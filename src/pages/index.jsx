import { useEffect, useRef, useState } from "react";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'
import { canvasPreview } from "@/components/canvasPreview";
import { compressImage } from "./helpers/imageHelpers";

export default function Home() {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [croppedImage, setCroppedImage] = useState(null);
  //Image
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  //Size
  const [size, setSize] = useState({ widthCrop: 768, heightCrop: 650 });
  const [widthCrop, setWidthCrop] = useState(768);
  const [heightCrop, setHeightCrop] = useState(650);
  const [result, setResult] = useState("");
  //REF
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  const previewCanvasRef = useRef(null);
  const hiddenAnchorRef = useRef(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    console.log(completedCrop);
  }, [completedCrop]);
  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
  }, []);
  // Cargar la imagen
  const handleImageChange = (e) => {
    setCrop(undefined)
    const file = e.target.files;
    if (file[0]) {
      setImage(file);
      setPreview(URL.createObjectURL(file[0]));
      setCrop(undefined);
    }
  };
  // Escalar la imagen para el recorte
  const onImageLoad = (e) => {
    imageRef.current = e.currentTarget;
    const { height, naturalHeight } = e.currentTarget;
    const scaleDiv = height / naturalHeight;
    console.log(scaleDiv);
    const scaleWidth = Math.round(size.widthCrop * scaleDiv);
    const scaleHeight = Math.round(size.heightCrop * scaleDiv);
    setWidthCrop(scaleWidth);
    setHeightCrop(scaleHeight);
  };

  //Redimensionar la imagen
  const handleResize = async () => {
    setResult(null);
    if (!image) return;

    // Enviar la imagen a la API
    const formData = new FormData();
    Array.from(image).forEach((file) => formData.append("file", file));
    formData.append("width", size.widthCrop);
    formData.append("height", size.heightCrop);

    const res = await fetch("/api/resize", {
      method: "POST",
      body: formData,
    });
    //Rescatar la imagen redimensionada
    const data = await res.json();
    console.log(data);
    if (data.success) {
      setResult(data.image[0]);
    } else {
      console.error("Failed to resize image");
    }
  };

  const cropImage = async () => {
    if (!completedCrop || !imageRef.current) return;

    const image = imageRef.current;

    // Obtén las escalas basadas en las dimensiones naturales
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Crea un lienzo con las dimensiones fijas deseadas
    const offscreen = new OffscreenCanvas(size.widthCrop, size.heightCrop);
    const ctx = offscreen.getContext("2d");

    // Ajusta el dibujo para encajar en las dimensiones deseadas
    console.log(`ctx.drawImage(
      ${image},
      ${completedCrop.x * scaleX},
      ${completedCrop.y * scaleY},
      ${completedCrop.width * scaleX},
      ${completedCrop.height * scaleY},
      ${0},
      ${0},
      ${size.widthCrop}, // Redimensiona al ancho exacto deseado
      ${size.heightCrop} // Redimensiona al alto exacto deseado
    );`)
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      size.widthCrop, // Redimensiona al ancho exacto deseado
      size.heightCrop // Redimensiona al alto exacto deseado
    );

    // Convierte el lienzo a un Blob con las dimensiones deseadas
    const blob = await offscreen.convertToBlob({ type: "image/jpeg", quality: 1 });
    console.log(blob);
    // Crear un archivo a partir del blob para usar con el compresor
    const file = new File([blob], "cropped-image.jpeg", { type: "image/jpeg" });

    console.log(file);
    
    // Comprimir la imagen
    const imageCropped = file.size < 100000 ? file : await compressImage(file);
    console.log(imageCropped);
    console.log(typeof imageCropped);
    if (imageCropped) {
      // Genera un URL para la imagen recortada
      const url = URL.createObjectURL(imageCropped);
      console.log(url);
      setCroppedImage(url);

      // Guarda el URL para la descarga
      blobUrlRef.current = url;
    } else {
      console.error("No se pudo comprimir la imagen.");
    }
  };

  const downloadImage = () => {
    if (!blobUrlRef.current || !hiddenAnchorRef.current) return;

    hiddenAnchorRef.current.href = blobUrlRef.current;
    hiddenAnchorRef.current.download = "cropped-image.jpeg";
    hiddenAnchorRef.current.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Redimensionar Imágenes</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Selecciona una imagen
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full"
            multiple={true}
          />
        </div>
        {result && (
          <>
            <div className="mt-4 mb-3">
              <p className="text-sm text-gray-700">Imagen redimensionada:</p>
              <div className="">
                <ReactCrop
                  crop={crop}
                  minWidth={widthCrop}
                  minHeight={heightCrop}
                  maxWidth={widthCrop}
                  maxHeight={heightCrop}
                  onChange={c => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                >
                  <img
                    ref={imageRef}
                    src={result}
                    alt="Resized"
                    className="w-full h-auto"
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex mb-4">
          <div className="w-1/2 mr-2">
            <label className="block text-sm font-medium text-gray-700">
              Ancho
            </label>
            <input
              type="number"
              defaultValue={size.widthCrop}
              onChange={(e) => {
                setWidthCrop(e.target.value)
                setSize({ ...size, widthCrop: e.target.value })
              }}
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="block text-sm font-medium text-gray-700">
              Alto
            </label>
            <input
              type="number"
              defaultValue={size.heightCrop}
              onChange={(e) => {
                setHeightCrop(e.target.value);
                setSize({ ...size, heightCrop: e.target.value })
              }}
              className="mt-1 block w-full border-gray-300 rounded-md"
            />
          </div>
        </div>

        <button
          onClick={handleResize}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mb-4"
        >
          Redimensionar
        </button>

        {completedCrop && (
          <>
            <div className="mt-4 mb-3">
              <button
                onClick={cropImage}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mb-4"
              >
                Recortar Imagen
              </button>
            </div>
          </>
        )}

        {croppedImage && (
          <div className="mb-4">
            <p className="text-sm text-gray-700">Imagen recortada:</p>
            <img
              src={croppedImage}
              alt="Cropped"
              className="w-full h-auto object-cover rounded-md"
            />
            <button
              onClick={downloadImage}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 mt-4"
            >
              Descargar Imagen
            </button>
            <a ref={hiddenAnchorRef} style={{ display: "none" }}>
              Descargar
            </a>
          </div>
        )}

        {/* result && (<div>
          <button
            onClick={handleResize}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
        ) */}
      </div>
    </div>
  );
}
