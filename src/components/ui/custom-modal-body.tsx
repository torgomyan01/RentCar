'use client';

import './_ui-components.scss';

interface CustomModalBodyProps {
  children: React.ReactNode;
}

export default function CustomModalBody({ children }: CustomModalBodyProps) {
  return <div className="custom-modal-body">{children}</div>;
}
