import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MedicationListPage from "./pages/MedicationListPage";
import MedicationDetailPage from "./pages/MedicationDetailPage";
import MedicationHistoryPage from "./pages/MedicationHistoryPage";
import AddMedicationPage from "./pages/AddMedicationPage";
import MedicationReceiptListPage from "./pages/MedicationReceiptListPage";
import CreateReceiptPage from "./pages/CreateReceiptPage";
import ReceiptDetailPage from "./pages/ReceiptDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MedicationListPage />} />
          <Route path="/medication/add" element={<AddMedicationPage />} />
          <Route path="/medication/receipt" element={<MedicationReceiptListPage />} />
          <Route path="/medication/receipt/create" element={<CreateReceiptPage />} />
          <Route path="/medication/receipt/new" element={<ReceiptDetailPage />} />
          <Route path="/medication/receipt/:receiptId" element={<ReceiptDetailPage />} />
          <Route path="/medication/:id" element={<MedicationDetailPage />} />
          <Route path="/medication/:id/edit" element={<AddMedicationPage />} />
          <Route path="/medication/:id/history" element={<MedicationHistoryPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
