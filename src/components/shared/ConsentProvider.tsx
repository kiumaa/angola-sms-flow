import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLegalConsent } from "@/hooks/useLegalConsent";
import { LegalConsentModal } from "@/components/auth/LegalConsentModal";

interface ConsentProviderProps {
  children: React.ReactNode;
}

export function ConsentProvider({ children }: ConsentProviderProps) {
  const { user } = useAuth();
  const { needsConsent, loading, userIp, refreshConsentStatus } = useLegalConsent();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user && !loading && needsConsent) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [user, loading, needsConsent]);

  const handleConsentComplete = () => {
    setShowModal(false);
    refreshConsentStatus();
  };

  return (
    <>
      {children}
      {user && showModal && (
        <LegalConsentModal
          isOpen={showModal}
          onComplete={handleConsentComplete}
          userId={user.id}
          userIp={userIp}
        />
      )}
    </>
  );
}