import Swal from "sweetalert2";
import "sweetalert2/src/sweetalert2.scss";

// Custom SweetAlert configurations with enhanced styling
const customSwal = Swal.mixin({
  customClass: {
    popup: "rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700",
    title: "text-2xl font-bold text-gray-800 dark:text-white",
    htmlContainer: "text-gray-600 dark:text-gray-300",
    confirmButton:
      "px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors duration-200",
    cancelButton:
      "px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg text-sm transition-colors duration-200 mr-3",
    actions: "mt-4 flex gap-3",
    icon: "mb-4",
  },
  buttonsStyling: false,
  background: "rgba(255, 255, 255, 0.98)",
  backdrop: `
    rgba(0, 0, 0, 0.4)
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-7c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")
    left top
    repeat
  `,
  showClass: {
    popup: "animate__animated animate__fadeInDown animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutUp animate__faster",
  },
});

// Success alerts
export const showSuccessAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: "success",
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

// Error alerts
export const showErrorAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: "error",
    title,
    text: message,
    confirmButtonText: "OK",
  });
};

// Warning alerts
export const showWarningAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: "warning",
    title,
    text: message,
    confirmButtonText: "OK",
  });
};

// Info alerts
export const showInfoAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: "info",
    title,
    text: message,
    confirmButtonText: "Got it!",
  });
};

// Confirmation alerts
export const showConfirmAlert = (
  title: string,
  message?: string,
  confirmText = "Yes",
  cancelText = "Cancel"
) => {
  return customSwal.fire({
    title,
    text: message,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
};

// Loading alert
export const showLoadingAlert = (title: string, message?: string) => {
  return customSwal.fire({
    title,
    text: message,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close loading alert
export const closeLoadingAlert = () => {
  Swal.close();
};

// Login success
export const showLoginSuccess = (userName: string) => {
  return showSuccessAlert(
    "Welcome Back!",
    `Hello ${userName}, you have successfully logged in.`
  );
};

// Signup success
export const showSignupSuccess = (userName: string) => {
  return showSuccessAlert(
    "Account Created!",
    `Welcome ${userName}! Your account has been created successfully.`
  );
};

// Booking success
export const showBookingSuccess = (
  courtName: string,
  date: string,
  time: string
) => {
  return showSuccessAlert(
    "Booking Confirmed!",
    `Your court "${courtName}" has been booked for ${date} at ${time}.`
  );
};

// Tournament creation success
export const showTournamentCreated = (tournamentName: string) => {
  return showSuccessAlert(
    "Tournament Created!",
    `"${tournamentName}" has been created successfully.`
  );
};

// Tournament join success
export const showTournamentJoined = (tournamentName: string) => {
  return showSuccessAlert(
    "Joined Tournament!",
    `You have successfully joined "${tournamentName}".`
  );
};

// Match creation success
export const showMatchCreated = () => {
  return showSuccessAlert(
    "Match Created!",
    "Your match has been created and is now available for others to join."
  );
};

// Match join success
export const showMatchJoined = () => {
  return showSuccessAlert(
    "Match Joined!",
    "You have successfully joined the match. Get ready to play!"
  );
};

// Facility creation success
export const showFacilityCreated = (facilityName: string) => {
  return showSuccessAlert(
    "Facility Created!",
    `"${facilityName}" has been created successfully.`
  );
};

// Court creation success
export const showCourtCreated = (courtName: string) => {
  return showSuccessAlert(
    "Court Added!",
    `"${courtName}" has been added to your facility.`
  );
};

// Slot management success
export const showSlotsUpdated = () => {
  return showSuccessAlert(
    "Slots Updated!",
    "Court availability has been updated successfully."
  );
};

// Profile update success
export const showProfileUpdated = () => {
  return showSuccessAlert(
    "Profile Updated!",
    "Your profile information has been saved successfully."
  );
};

// Logout confirmation
export const showLogoutConfirm = () => {
  return showConfirmAlert(
    "Logout",
    "Are you sure you want to logout?",
    "Yes, Logout",
    "Cancel"
  );
};

// Delete confirmation
export const showDeleteConfirm = (itemName: string, itemType: string) => {
  return showConfirmAlert(
    `Delete ${itemType}`,
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    "Yes, Delete",
    "Cancel"
  );
};

// Cancel booking confirmation
export const showCancelBookingConfirm = () => {
  return showConfirmAlert(
    "Cancel Booking",
    "Are you sure you want to cancel this booking?",
    "Yes, Cancel",
    "Keep Booking"
  );
};

// Payment success
export const showPaymentSuccess = (amount: string) => {
  return showSuccessAlert(
    "Payment Successful!",
    `Your payment of ₹${amount} has been processed successfully.`
  );
};

// Verification success
export const showVerificationSuccess = () => {
  return customSwal.fire({
    icon: "success",
    title: "Email Verified!",
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Verified!</h3>
        <p class="text-gray-600 dark:text-gray-300">Your email has been successfully verified. Welcome to PicklePro!</p>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: "Continue to Dashboard",
    timer: 5000,
    timerProgressBar: true,
  });
};

// Password Reset Alerts
export const showPasswordResetSent = (email: string) => {
  return customSwal.fire({
    icon: "info",
    title: "Check Your Email",
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Reset Link Sent</h3>
        <p class="text-gray-600 dark:text-gray-300">We've sent a password reset link to <span class="font-semibold">${email}</span>. Please check your inbox and follow the instructions.</p>
      </div>
    `,
    showConfirmButton: false,
    timer: 7000,
    timerProgressBar: true,
  });
};

export const showPasswordResetSuccess = () => {
  return customSwal.fire({
    icon: "success",
    title: "Password Updated!",
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Password Changed Successfully</h3>
        <p class="text-gray-600 dark:text-gray-300">Your password has been updated. Please login with your new credentials.</p>
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: "Go to Login",
  });
};

// Form validation error
export const showValidationError = (message: string) => {
  return customSwal.fire({
    icon: "error",
    title: "Validation Error",
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Please fix the following:</h3>
        <p class="text-gray-600 dark:text-gray-300">${
          message || "Some fields require your attention."
        }</p>
      </div>
    `,
    confirmButtonText: "Got it",
  });
};

// Network error
export const showNetworkError = (errorMessage?: string) => {
  return customSwal.fire({
    icon: "error",
    title: "Connection Error",
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Connection Problem</h3>
        <p class="text-gray-600 dark:text-gray-300">${
          errorMessage ||
          "Unable to connect to the server. Please check your internet connection and try again."
        }</p>
      </div>
    `,
    confirmButtonText: "Retry",
    showCancelButton: true,
    cancelButtonText: "Cancel",
  });
};

// Session expired
export const showSessionExpired = () => {
  return customSwal.fire({
    icon: "warning",
    title: "Session Expired",
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Session Timed Out</h3>
        <p class="text-gray-600 dark:text-gray-300">Your session has expired due to inactivity. Please log in again to continue.</p>
      </div>
    `,
    confirmButtonText: "Go to Login",
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
  });
};

// Generic success with custom message
export const showCustomSuccess = (
  title: string,
  message: string,
  timer = 3000
) => {
  return customSwal.fire({
    icon: "success",
    title,
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">${title}</h3>
        <p class="text-gray-600 dark:text-gray-300">${message}</p>
      </div>
    `,
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

// Generic error with custom message
export const showCustomError = (title: string, message: string) => {
  return customSwal.fire({
    icon: "error",
    title,
    html: `
      <div class="text-center">
        <svg class="mx-auto mb-4 w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">${title}</h3>
        <p class="text-gray-600 dark:text-gray-300">${message}</p>
      </div>
    `,
    confirmButtonText: "OK",
  });
};

// Tournament-specific alerts
export const tournamentAlerts = {
  confirmDelete: async (tournamentName: string) => {
    return await showDeleteConfirm(tournamentName, "Tournament");
  },

  error: (message: string) => {
    return showErrorAlert("Tournament Error", message);
  },

  deleted: () => {
    return showSuccessAlert(
      "Tournament Deleted!",
      "The tournament has been deleted successfully."
    );
  },

  updated: () => {
    return showSuccessAlert(
      "Tournament Updated!",
      "The tournament has been updated successfully."
    );
  },

  created: (tournamentName: string) => {
    return showTournamentCreated(tournamentName);
  },

  joined: (tournamentName: string) => {
    return showTournamentJoined(tournamentName);
  },
};
