import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, MessageSquare, Clock } from "lucide-react";
import { calculateSMSSegments } from "@/lib/smsUtils";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
  message: string;
  senderName?: string;
  className?: string;
}

export function MessagePreview({ message, senderName = "SMSAO", className }: MessagePreviewProps) {
  const segmentInfo = useMemo(() => calculateSMSSegments(message), [message]);
  
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={cn("w-full max-w-sm mx-auto", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Smartphone className="h-4 w-4" />
          Preview do SMS
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Phone mockup */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 p-4 rounded-2xl border-2 border-slate-700 shadow-xl">
          {/* Phone header */}
          <div className="flex justify-between items-center mb-4 text-white text-xs">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
            <div className="font-mono">{getCurrentTime()}</div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 border border-white rounded-sm">
                <div className="w-full h-full bg-white rounded-sm opacity-75"></div>
              </div>
            </div>
          </div>
          
          {/* Message bubble */}
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-slate-600">{senderName}</span>
              <Clock className="h-3 w-3 text-slate-400 ml-auto" />
            </div>
            
            <div className="text-sm text-slate-900 leading-relaxed">
              {message || (
                <span className="italic text-slate-400">
                  Digite sua mensagem para ver a preview...
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Message stats */}
        {message && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Caracteres:</span>
              <span className="font-mono">{segmentInfo.totalChars}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Codificação:</span>
              <Badge variant={segmentInfo.encoding === 'GSM7' ? 'default' : 'secondary'} className="text-xs">
                {segmentInfo.encoding === 'GSM7' ? 'GSM (padrão)' : 'Unicode'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Segmentos:</span>
              <Badge variant={segmentInfo.segments > 1 ? 'destructive' : 'default'} className="text-xs">
                {segmentInfo.segments} SMS
              </Badge>
            </div>
            
            {segmentInfo.segments > 1 && (
              <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded border border-amber-200 dark:border-amber-800">
                ⚠ Mensagem será enviada em {segmentInfo.segments} partes
              </div>
            )}
            
            {!segmentInfo.isValid && (
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                ⚠ {segmentInfo.reason}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}