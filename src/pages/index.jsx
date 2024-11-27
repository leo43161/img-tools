import { useEffect, useRef, useState } from "react";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'
import { canvasPreview } from "@/components/canvasPreview";

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

  useEffect(() => {
    console.log(completedCrop);
  }, [completedCrop])
  // Cargar la imagen
  const handleImageChange = (e) => {
    setCrop(undefined)
    const file = e.target.files;
    if (file[0]) {
      setImage(file);
      setPreview(URL.createObjectURL(file[0]));
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
    /* console.log(data); */
    if (data.success) {
      setResult(data.image[0]);
    } else {
      console.error("Failed to resize image");
    }
  };

  const cropImage = () => {
    if (!completedCrop || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Generar una URL de imagen recortada
    const croppedURL = canvas.toDataURL("image/png");
    setCroppedImage(croppedURL);
  };

  const downloadImage = () => {
    if (!croppedImage) return;
    const link = document.createElement("a");
    link.href = croppedImage;
    link.download = "cropped-image.png";
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Redimensionar Imágenes</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full">
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
                setsetWidthCropsetWidthCropsetWidthCrop(e.target.value)
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


        <button
          onClick={handleResize}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mb-4"
        >
          Redimensionar
        </button>

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
