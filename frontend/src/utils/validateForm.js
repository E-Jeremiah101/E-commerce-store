export function checkRequired(value, fieldName) {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  return "";
}

export function checkLength(value, min, max, fieldName) {
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  } else if (value.length > max) {
    return `${fieldName} must be less than ${max} characters`;
  }
  return "";
}

export function checkEmail(value) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value.trim())) {
    return "Email is not valid";
  }
  return "";
}


