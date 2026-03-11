import React from "react";

export interface CopiableFieldProps {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  readOnly?: boolean;
  mono?: boolean;
}
