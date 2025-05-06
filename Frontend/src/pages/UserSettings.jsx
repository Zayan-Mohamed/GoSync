import { useState, useEffect } from "react";
import useAuthStore from "../store/authStore";
import API from "../services/authService";
import AdminLayout from "../layouts/AdminLayout";
import BookingLayout from "../layouts/BookingLayout";
import { toast } from "react-toastify";
import { FiUser, FiLock, FiBell, FiMapPin, FiShield } from "react-icons/fi";

const UserSettings = () => {
  const { user, isAuthenticated, updateUserState } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [securityLog, setSecurityLog] = useState([]);
  const DEFAULT_AVATAR_PATH = "/assets/default-avatar.png";

  const handleImageError = (e) => {
    e.target.src = "/assets/default-avatar.png";
    e.target.onerror = null;
  };

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePicture: null,
    profilePicturePreview: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [addressData, setAddressData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    sms: false,
    push: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        profilePicture: null,
        profilePicturePreview:
          user.profilePictureData || user.profilePicture || "",
      });

      if (user.address) {
        setAddressData({
          street: user.address.street || "",
          city: user.address.city || "",
          state: user.address.state || "",
          zipCode: user.address.zipCode || "",
          country: user.address.country || "",
        });
      }

      if (user.notificationPreferences) {
        setNotificationPreferences({
          email:
            user.notificationPreferences.email !== undefined
              ? user.notificationPreferences.email
              : true,
          sms:
            user.notificationPreferences.sms !== undefined
              ? user.notificationPreferences.sms
              : false,
          push:
            user.notificationPreferences.push !== undefined
              ? user.notificationPreferences.push
              : true,
        });
      }

      if (activeTab === "security") {
        fetchSecurityLog();
      }
    }
  }, [user, activeTab]);

  const fetchSecurityLog = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/api/auth/security-log");
      setSecurityLog(data.securityLog || []);
    } catch (error) {
      console.error("Error fetching security log:", error);
      toast.error("Failed to fetch security activity");
    } finally {
      setLoading(false);
    }
  };

  const fetchBase64ProfileImage = async () => {
    try {
      if (!user.profilePicture) {
        return false;
      }

      const imageUrl = user.profilePicture;

      const response = await fetch(imageUrl);
      if (!response.ok) {
        return false;
      }

      const blob = await response.blob();

      const reader = new FileReader();

      return new Promise((resolve) => {
        reader.onload = () => {
          const base64data = reader.result;

          updateUserState({
            ...user,
            profilePictureData: base64data,
          });

          setProfileData((prev) => ({
            ...prev,
            profilePicturePreview: base64data,
          }));

          resolve(true);
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return false;
    }
  };

  const verifyAndLoadImage = async (imageUrl) => {
    try {
      if (!profileData.profilePicturePreview.startsWith("data:")) {
        const defaultImageUrl = "/assets/default-profile.jpg";

        try {
          const fetchUrl = `${imageUrl}?t=${new Date().getTime()}`;
          const response = await fetch(fetchUrl);

          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.statusText}`);
          }

          const blob = await response.blob();
          const reader = new FileReader();

          reader.onload = () => {
            const base64data = reader.result;

            updateUserState({
              ...user,
              profilePictureData: base64data,
            });

            setProfileData((prev) => ({
              ...prev,
              profilePicturePreview: base64data,
            }));
          };

          reader.readAsDataURL(blob);
          return true;
        } catch (error) {
          setProfileData((prev) => ({
            ...prev,
            profilePicturePreview: defaultImageUrl,
          }));

          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG or GIF)");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image file is too large. Maximum size is 5MB");
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      setProfileData({
        ...profileData,
        profilePicture: file,
        profilePicturePreview: previewUrl,
      });

      uploadProfileImage(file);
    }
  };

  const uploadProfileImage = async (imageFile) => {
    try {
      setLoading(true);
      toast.info("Uploading profile image...");

      const formData = new FormData();
      formData.append("profileImage", imageFile);

      const { data } = await API.post(
        "/api/auth/upload-profile-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!data.profilePictureData && !data.profilePicture) {
        toast.error("Server did not return valid image data");
        setLoading(false);
        return;
      }

      const imageSource = data.profilePictureData || data.profilePicture;

      updateUserState({
        ...user,
        profilePicture: data.profilePicture,
        profilePictureData: data.profilePictureData,
      });

      setProfileData((prev) => ({
        ...prev,
        profilePicturePreview: imageSource,
      }));

      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to upload profile image"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    setAddressData({ ...addressData, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e) => {
    setNotificationPreferences({
      ...notificationPreferences,
      [e.target.name]: e.target.checked,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      let dataToSend;
      if (profileData.profilePicture) {
        const formData = new FormData();
        formData.append("name", profileData.name);
        formData.append("phone", profileData.phone);
        formData.append("profilePicture", profileData.profilePicture);
        dataToSend = formData;
      } else {
        dataToSend = {
          name: profileData.name,
          phone: profileData.phone,
        };
      }

      const { data } = await API.put("/api/auth/update", dataToSend);
      updateUserState(data.user);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    try {
      setLoading(true);
      await API.post("/api/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully!");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await API.put("/api/auth/update", {
        address: addressData,
      });

      updateUserState(data.user);
      toast.success("Address updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update address");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await API.put(
        "/api/auth/notification-preferences",
        notificationPreferences
      );

      updateUserState({
        ...user,
        notificationPreferences: data.preferences,
      });

      toast.success("Notification preferences updated!");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update notification preferences"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <p className="text-center text-red-500">
        Please log in to access settings.
      </p>
    );
  }

  const Layout = user?.role === "admin" ? AdminLayout : BookingLayout;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto my-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-deepOrange">
          Account Settings
        </h1>

        <div className="flex flex-wrap mb-6 border-b">
          <button
            className={`mr-4 py-2 px-4 font-medium ${
              activeTab === "profile"
                ? "text-deepOrange border-b-2 border-deepOrange"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            <FiUser className="inline mr-2" /> Profile
          </button>
          <button
            className={`mr-4 py-2 px-4 font-medium ${
              activeTab === "security"
                ? "text-deepOrange border-b-2 border-deepOrange"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("security")}
          >
            <FiLock className="inline mr-2" /> Security
          </button>
          <button
            className={`mr-4 py-2 px-4 font-medium ${
              activeTab === "address"
                ? "text-deepOrange border-b-2 border-deepOrange"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("address")}
          >
            <FiMapPin className="inline mr-2" /> Address
          </button>
          <button
            className={`mr-4 py-2 px-4 font-medium ${
              activeTab === "notifications"
                ? "text-deepOrange border-b-2 border-deepOrange"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("notifications")}
          >
            <FiBell className="inline mr-2" /> Notifications
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Profile Information
              </h2>

              <div className="flex flex-col items-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mb-4">
                  {profileData.profilePicturePreview ? (
                    profileData.profilePicturePreview.startsWith("data:") ? (
                      <img
                        src={profileData.profilePicturePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <img
                        src={profileData.profilePicturePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <FiUser size={48} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md">
                  Change Picture
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-deepOrange text-white py-2 px-6 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>

              <form onSubmit={handlePasswordSubmit} className="mb-10 space-y-4">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-deepOrange text-white py-2 px-6 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FiShield className="mr-2" /> Security Activity
                </h3>

                {loading ? (
                  <p>Loading security log...</p>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securityLog.length > 0 ? (
                          securityLog.map((log, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {log.action === "password_change"
                                  ? "Password Changed"
                                  : log.action}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {log.ipAddress}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              No security activity recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <form onSubmit={handleAddressSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Address Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={addressData.street}
                    onChange={handleAddressChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={addressData.city}
                    onChange={handleAddressChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={addressData.state}
                    onChange={handleAddressChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Postal/Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={addressData.zipCode}
                    onChange={handleAddressChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={addressData.country}
                    onChange={handleAddressChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-deepOrange"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-deepOrange text-white py-2 px-6 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">
                Notification Preferences
              </h2>
              <p className="text-gray-500 mb-6">
                Select how you would like to receive notifications from GoSync
              </p>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="email"
                    checked={notificationPreferences.email}
                    onChange={handleNotificationChange}
                    className="h-5 w-5 text-deepOrange focus:ring-deepOrange border-gray-300 rounded"
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="ml-3 block text-gray-700"
                  >
                    <span className="font-medium">Email Notifications</span>
                    <p className="text-sm text-gray-500">
                      Receive booking updates and travel information via email
                    </p>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    name="sms"
                    checked={notificationPreferences.sms}
                    onChange={handleNotificationChange}
                    className="h-5 w-5 text-deepOrange focus:ring-deepOrange border-gray-300 rounded"
                  />
                  <label
                    htmlFor="smsNotifications"
                    className="ml-3 block text-gray-700"
                  >
                    <span className="font-medium">SMS Notifications</span>
                    <p className="text-sm text-gray-500">
                      Receive booking updates and travel information via SMS
                    </p>
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    name="push"
                    checked={notificationPreferences.push}
                    onChange={handleNotificationChange}
                    className="h-5 w-5 text-deepOrange focus:ring-deepOrange border-gray-300 rounded"
                  />
                  <label
                    htmlFor="pushNotifications"
                    className="ml-3 block text-gray-700"
                  >
                    <span className="font-medium">Push Notifications</span>
                    <p className="text-sm text-gray-500">
                      Receive booking updates and travel information via push
                      notifications
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-deepOrange text-white py-2 px-6 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserSettings;
