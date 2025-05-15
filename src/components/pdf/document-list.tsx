import { FileText, MessageSquare, MoreVertical, Trash2, Info } from "lucide-react";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useToast } from "../../hooks/use-toast";

export interface Document {
  id: string;
  name: string;
  uploadDate: Date;
  size: number;
  pageCount: number;
}

interface DocumentListProps {
  documents: Document[];
  onSelectDocument?: (document: Document) => void;
  onDeleteDocument?: (documentId: string) => void;
  onViewMetadata?: (documentId: string) => void;
}

export function DocumentList({
  documents,
  onSelectDocument,
  onDeleteDocument,
  onViewMetadata,
}: DocumentListProps) {
  const { toast } = useToast();

  const handleDelete = (document: Document) => {
    if (onDeleteDocument) {
      onDeleteDocument(document.id);
      toast({
        title: "Document deleted",
        description: `${document.name} has been removed.`,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No documents yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          Upload a PDF to get started
        </p>
        <Button asChild>
          <a href="/">Upload a document</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((document) => (
        <Card key={document.id} className="overflow-hidden">
          <div className="aspect-video bg-muted flex items-center justify-center relative">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewMetadata && (
                    <DropdownMenuItem
                      onClick={() => onViewMetadata(document.id)}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      View Metadata
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDelete(document)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium truncate" title={document.name}>
              {document.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{formatDate(document.uploadDate)}</span>
              <span>•</span>
              <span>{formatFileSize(document.size)}</span>
              <span>•</span>
              <span>{document.pageCount} pages</span>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => onSelectDocument && onSelectDocument(document)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat with document
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
