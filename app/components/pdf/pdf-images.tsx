import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DocumentImage, ImagesResponse, APIResponse } from "~/types";
import { Eye, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface PDFImagesProps {
  imagesUrl: string;
}

export function PDFImages({ imagesUrl }: PDFImagesProps) {
  const [images, setImages] = useState<DocumentImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<DocumentImage | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  useEffect(() => {
    fetchImages();
  }, [imagesUrl]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(imagesUrl);
      const result: APIResponse<ImagesResponse> = await response.json();
      
      if (result.status === "success" && result.data) {
        setImages(result.data.images);
      } else {
        setError(result.error || "Failed to load images");
      }
    } catch (err) {
      setError("Failed to fetch images");
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image: DocumentImage) => {
    setSelectedImage(image);
    setImageScale(1);
    setImageRotation(0);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setImageScale(1);
    setImageRotation(0);
  };

  const handleZoomIn = () => {
    setImageScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = (image: DocumentImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `page-${image.pageNumber}-image-${image.imageIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="border border-white/20 rounded-xl p-8 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Extracted Images</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-2 text-gray-300">Loading images...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500/20 rounded-xl p-8 bg-red-500/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Extracted Images</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button 
            onClick={fetchImages} 
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="border border-white/20 rounded-xl p-8 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Extracted Images</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">No images found in this document.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-white/20 rounded-xl p-8 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <Eye className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">
            Extracted Images ({images.length})
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer border border-white/20 rounded-lg overflow-hidden hover:shadow-lg hover:border-white/40 transition-all bg-white/5"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image.url}
                alt={`Page ${image.pageNumber} Image ${image.imageIndex + 1}`}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2">
                <p>Page {image.pageNumber}</p>
                <p>Image {image.imageIndex + 1}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                Page {selectedImage.pageNumber} - Image {selectedImage.imageIndex + 1}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={imageScale <= 0.25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2">{Math.round(imageScale * 100)}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={imageScale >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(selectedImage)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              <div className="flex justify-center">
                <img
                  src={selectedImage.url}
                  alt={`Page ${selectedImage.pageNumber} Image ${selectedImage.imageIndex + 1}`}
                  className="max-w-full h-auto"
                  style={{
                    transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                    transition: 'transform 0.2s ease-in-out'
                  }}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                <p><strong>Page:</strong> {selectedImage.pageNumber}</p>
                <p><strong>Image Index:</strong> {selectedImage.imageIndex + 1}</p>
                <p><strong>Bounding Box:</strong> ({selectedImage.boundingBox.topLeftX}, {selectedImage.boundingBox.topLeftY}) to ({selectedImage.boundingBox.bottomRightX}, {selectedImage.boundingBox.bottomRightY})</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
