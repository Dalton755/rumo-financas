import { Toast, ToastContainer } from "react-bootstrap";
import {
  CheckCircleFill,
  ExclamationTriangleFill,
  InfoCircleFill,
  XCircleFill,
} from "react-bootstrap-icons";

const icons = {
  success: <CheckCircleFill size={20} className="me-2" />,
  danger: <XCircleFill size={20} className="me-2" />,
  warning: <ExclamationTriangleFill size={20} className="me-2" />,
  info: <InfoCircleFill size={20} className="me-2" />,
};

export default function AppToast({ toast, hideToast }) {
  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{
        zIndex: 9999,
      }}
    >
      <Toast
        bg={toast.bg}
        show={toast.show}
        onClose={hideToast}
        delay={3500}
        autohide
        className="shadow border-0 rounded-4"
      >
        <Toast.Header closeButton>
          {icons[toast.bg] ?? icons.info}

          <strong className="me-auto">
            {toast.title}
          </strong>
        </Toast.Header>

        <Toast.Body
          className={
            toast.bg === "light"
              ? ""
              : "text-white"
          }
        >
          {toast.message}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}