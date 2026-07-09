import { useTranslation } from "react-i18next";

const LanguageButton = () => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language?.startsWith("ko") ? "ko" : "en";

  const toggleLanguage = () => {
    const nextLang = currentLang === "ko" ? "en" : "ko";
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="hover:bg-gray-200 p-2 rounded-md text-sm"
      aria-label="Toggle language"
    >
      {i18n.language === "ko" ? "English" : "한국어"}
    </button>
  );
};

export default LanguageButton;
