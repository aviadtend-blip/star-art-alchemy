import { OrderConfirmation } from "@/components/Purchase/OrderConfirmation";
import { useNavigate } from "react-router-dom";

const OrderConfirmationPage = () => {
  const navigate = useNavigate();

  return (
    <OrderConfirmation
      chartData={null}
      artworkImage={null}
      orderDetails={null}
      onNewChart={() => navigate("/")}
    />
  );
};

export default OrderConfirmationPage;
