import { Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import AnalysisPage from "@/pages/AnalysisPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { ToastProvider } from "@/components/ToastProvider";

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analysis/:owner/:repo" element={<AnalysisPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  );
}
