import { OrderConfirmation } from "@/components/Purchase/OrderConfirmation";
import { useNavigate } from "react-router-dom";
import { useGenerator } from "@/contexts/GeneratorContext";

const OrderConfirmationPage = () => {
  const navigate = useNavigate();
  const { chartData, generatedImage, orderDetails } = useGenerator();

  return (
    <OrderConfirmation
      chartData={chartData}
      artworkImage={generatedImage}
      orderDetails={orderDetails}
      onNewChart={() => navigate("/")}
    />
  );
};

export default OrderConfirmationPage;
