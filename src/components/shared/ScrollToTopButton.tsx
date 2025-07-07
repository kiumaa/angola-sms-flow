import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useScrollToTop } from "@/hooks/usePerformance";

export const ScrollToTopButton = () => {
  const { isVisible, scrollToTop } = useScrollToTop();

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 btn-gradient"
      size="icon"
      aria-label="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
};