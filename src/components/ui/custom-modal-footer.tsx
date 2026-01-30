'use client';

import './_ui-components.scss';

interface CustomModalFooterProps {
  children: React.ReactNode;
}

export default function CustomModalFooter({
  children,
}: CustomModalFooterProps) {
  return <div className="custom-modal-footer">{children}</div>;
}
