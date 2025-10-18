import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
        <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-lg">
          <Search className="w-5 h-5 text-muted-foreground ml-2" />
          <Input
            type="text"
            placeholder="Buscar música..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>
    </form>
  );
};