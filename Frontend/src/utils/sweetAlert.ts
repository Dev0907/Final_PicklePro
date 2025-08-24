import Swal from 'sweetalert2';

// Custom SweetAlert configurations with the new color scheme
const customSwal = Swal.mixin({
  customClass: {
    popup: 'swal2-popup',
    title: 'swal2-title',
    content: 'swal2-content',
    confirmButton: 'swal2-confirm',
    cancelButton: 'swal2-cancel'
  },
  buttonsStyling: false
});

// Success alerts
export const showSuccessAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false
  });
};

// Error alerts
export const showErrorAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK'
  });
};

// Warning alerts
export const showWarningAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'OK'
  });
};

// Info alerts
export const showInfoAlert = (title: string, message?: string) => {
  return customSwal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'Got it!'
  });
};

// Confirmation alerts
export const showConfirmAlert = (title: string, message?: string, confirmText = 'Yes', cancelText = 'Cancel') => {
  return customSwal.fire({
    title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true
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
    }
  });
};

// Close loading alert
export const closeLoadingAlert = () => {
  Swal.close();
};

// Login success
export const showLoginSuccess = (userName: string) => {
  return showSuccessAlert(
    'Welcome Back!',
    `Hello ${userName}, you have successfully logged in.`
  );
};

// Signup success
export const showSignupSuccess = (userName: string) => {
  return showSuccessAlert(
    'Account Created!',
    `Welcome ${userName}! Your account has been created successfully.`
  );
};

// Booking success
export const showBookingSuccess = (courtName: string, date: string, time: string) => {
  return showSuccessAlert(
    'Booking Confirmed!',
    `Your court "${courtName}" has been booked for ${date} at ${time}.`
  );
};

// Tournament creation success
export const showTournamentCreated = (tournamentName: string) => {
  return showSuccessAlert(
    'Tournament Created!',
    `"${tournamentName}" has been created successfully.`
  );
};

// Tournament join success
export const showTournamentJoined = (tournamentName: string) => {
  return showSuccessAlert(
    'Joined Tournament!',
    `You have successfully joined "${tournamentName}".`
  );
};

// Match creation success
export const showMatchCreated = () => {
  return showSuccessAlert(
    'Match Created!',
    'Your match has been created and is now available for others to join.'
  );
};

// Match join success
export const showMatchJoined = () => {
  return showSuccessAlert(
    'Match Joined!',
    'You have successfully joined the match. Get ready to play!'
  );
};

// Facility creation success
export const showFacilityCreated = (facilityName: string) => {
  return showSuccessAlert(
    'Facility Created!',
    `"${facilityName}" has been created successfully.`
  );
};

// Court creation success
export const showCourtCreated = (courtName: string) => {
  return showSuccessAlert(
    'Court Added!',
    `"${courtName}" has been added to your facility.`
  );
};

// Slot management success
export const showSlotsUpdated = () => {
  return showSuccessAlert(
    'Slots Updated!',
    'Court availability has been updated successfully.'
  );
};

// Profile update success
export const showProfileUpdated = () => {
  return showSuccessAlert(
    'Profile Updated!',
    'Your profile information has been saved successfully.'
  );
};

// Logout confirmation
export const showLogoutConfirm = () => {
  return showConfirmAlert(
    'Logout',
    'Are you sure you want to logout?',
    'Yes, Logout',
    'Cancel'
  );
};

// Delete confirmation
export const showDeleteConfirm = (itemName: string, itemType: string) => {
  return showConfirmAlert(
    `Delete ${itemType}`,
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    'Yes, Delete',
    'Cancel'
  );
};

// Cancel booking confirmation
export const showCancelBookingConfirm = () => {
  return showConfirmAlert(
    'Cancel Booking',
    'Are you sure you want to cancel this booking?',
    'Yes, Cancel',
    'Keep Booking'
  );
};

// Payment success
export const showPaymentSuccess = (amount: string) => {
  return showSuccessAlert(
    'Payment Successful!',
    `Your payment of ₹${amount} has been processed successfully.`
  );
};

// Verification success
export const showVerificationSuccess = () => {
  return showSuccessAlert(
    'Verification Complete!',
    'Your account has been verified successfully.'
  );
};

// Form validation error
export const showValidationError = (message: string) => {
  return showErrorAlert(
    'Validation Error',
    message
  );
};

// Network error
export const showNetworkError = () => {
  return showErrorAlert(
    'Connection Error',
    'Please check your internet connection and try again.'
  );
};

// Generic success with custom message
export const showCustomSuccess = (title: string, message: string, timer = 3000) => {
  return customSwal.fire({
    icon: 'success',
    title,
    text: message,
    timer,
    timerProgressBar: true,
    showConfirmButton: false
  });
};

// Generic error with custom message
export const showCustomError = (title: string, message: string) => {
  return customSwal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK'
  });
};

// Tournament-specific alerts
export const tournamentAlerts = {
  confirmDelete: async (tournamentName: string) => {
    return await showDeleteConfirm(tournamentName, 'Tournament');
  },
  
  error: (message: string) => {
    return showErrorAlert('Tournament Error', message);
  },
  
  deleted: () => {
    return showSuccessAlert('Tournament Deleted!', 'The tournament has been deleted successfully.');
  },
  
  updated: () => {
    return showSuccessAlert('Tournament Updated!', 'The tournament has been updated successfully.');
  },
  
  created: (tournamentName: string) => {
    return showTournamentCreated(tournamentName);
  },
  
  joined: (tournamentName: string) => {
    return showTournamentJoined(tournamentName);
  }
};