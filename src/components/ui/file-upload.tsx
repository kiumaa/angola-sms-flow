import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  selectedFile?: File | null;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept = ".csv,.xlsx,.xls",
  maxSize = 5,
  selectedFile,
  className,
  children
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setError(null);
    
    // Check file size
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo ${maxSize}MB permitido.`);
      return;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isValidType = acceptedTypes.some(acceptedType => {
      if (acceptedType === 'image/*') {
        return file.type.startsWith('image/');
      }
      if (acceptedType.startsWith('.')) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        return fileExtension === acceptedType;
      }
      return file.type === acceptedType;
    });
    
    if (!isValidType) {
      setError(`Tipo de arquivo não suportado. Aceitos: ${accept}`);
      return;
    }

    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setError(null);
    if (onFileRemove) {
      onFileRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (selectedFile) {
    return (
      <Card className={cn("border-2 border-success bg-success/5", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium text-success">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "border-2 border-dashed transition-colors cursor-pointer",
        isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        error && "border-destructive bg-destructive/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center text-center space-y-4">
          {error ? (
            <AlertTriangle className="h-12 w-12 text-destructive" />
          ) : (
            <Upload className={cn(
              "h-12 w-12 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
          )}
          
          <div className="space-y-2">
            {error ? (
              <p className="text-destructive font-medium">{error}</p>
            ) : (
              <>
                <p className="text-lg font-medium">
                  {children || "Clique ou arraste o arquivo aqui"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos aceitos: {accept} | Máximo: {maxSize}MB
                </p>
              </>
            )}
          </div>
          
          {!error && (
            <Button type="button" variant="outline">
              <File className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}