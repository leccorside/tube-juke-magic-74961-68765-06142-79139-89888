import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface SharePopoverProps {
  playlistId: string;
}

export const SharePopover: React.FC<SharePopoverProps> = ({ playlistId }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/share/playlist/${playlistId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" onClick={(e) => e.stopPropagation()}>
        <h4 className="font-semibold mb-2">Compartilhar Playlist</h4>
        <div className="flex space-x-2">
          <Input 
            value={shareUrl} 
            readOnly 
            className="flex-1 bg-muted"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button onClick={handleCopy} size="icon">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Qualquer pessoa com o link poderá visualizar esta playlist.
        </p>
      </PopoverContent>
    </Popover>
  );
};