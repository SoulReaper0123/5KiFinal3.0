import React, { useState, useEffect } from 'react';
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
} from 'firebase/database';
import {
  getAuth,
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faDownload,
  faCheckCircle,
  faExclamationCircle,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = '';
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) {
    return generateRandomPassword();
  }
  return pwd;
};

const Admins = ({ setShowSplash }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [contactNumberError, setContactNumberError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmAddVisible, setConfirmAddVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingAdd, setPendingAdd] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const pageSize = 10;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isSmallScreen = windowWidth < 800;

  const tableHead = ['ID', 'Name', 'Email', 'Contact', 'Date Added', 'Actions'];

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const db = getDatabase();
    const adminRef = ref(db, 'Users/Admin');
    return onValue(adminRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loaded = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setAdmins(loaded);
      setLoading(false);
    });
  }, []);

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAdminModal = (admin) => {
    setSelectedAdmin(admin);
    setAdminModalVisible(true);
  };

  const closeAdminModal = () => {
    setAdminModalVisible(false);
    setSelectedAdmin(null);
  };

  const tableData = filteredAdmins.map((admin) => [
    <div key={`id-${admin.id}`} className="cellCenter">
      <span className="rowText">{admin.id}</span>
    </div>,
    <div key={`name-${admin.id}`} className="cellCenter">
      <span className="rowText">{admin.name}</span>
    </div>,
    <div key={`email-${admin.id}`} className="cellCenter">
      <span className="rowText">{admin.email}</span>
    </div>,
    <div key={`contact-${admin.id}`} className="cellCenter">
      <span className="rowText">{admin.contactNumber}</span>
    </div>,
    <div key={`date-${admin.id}`} className="cellCenter">
      <span className="rowText">{admin.dateAdded}</span>
    </div>,
    <div key={`actions-${admin.id}`} className="actionsRow">
      <button
        onClick={() => openAdminModal(admin)}
        className="viewButton"
      >
        <span className="viewButtonText">View</span>
      </button>
    </div>,
  ]);

  const validateFields = () => {
    let isValid = true;
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
    };

    if (!firstName) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    if (!lastName) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!email) {
      errors.email = 'Email is required';
      isValid = false;
    }

    if (!contactNumber) {
      errors.contactNumber = 'Contact number is required';
      isValid = false;
    } else if (!/^\d+$/.test(contactNumber)) {
      errors.contactNumber = 'Contact number must be numeric';
      isValid = false;
    }

    setFirstNameError(errors.firstName);
    setLastNameError(errors.lastName);
    setEmailError(errors.email);
    setContactNumberError(errors.contactNumber);

    return isValid;
  };

  const onPressAdd = async () => {
    if (!validateFields()) {
      return;
    }

    const auth = getAuth();
    const emailUsed = admins.some((a) => a.email === email);
    const signInMethods = await fetchSignInMethodsForEmail(auth, email);
    if (emailUsed || (signInMethods && signInMethods.length > 0)) {
      setEmailError('Email already in use.');
      return;
    }

    setPendingAdd({ firstName, middleName, lastName, email, contactNumber });
    setConfirmAddVisible(true);
  };

  const handleAddAdmin = async () => {
    setConfirmAddVisible(false);
    setIsProcessing(true);

    try {
      const { firstName, middleName, lastName, email, contactNumber } = pendingAdd;
      const password = generateRandomPassword();
      const auth = getAuth();

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const highest =
        admins.length > 0
          ? Math.max(
              ...admins.map((a) =>
                parseInt(a.id.replace('admin', '') || '0', 10)
              )
            )
          : 0;
      const newID = 'admin' + (highest + 1);
      const dateAdded = new Date().toLocaleString();

      await set(ref(getDatabase(), 'Users/Admin/' + newID), {
        id: newID,
        uid,
        name: `${firstName} ${middleName} ${lastName}`,
        email,
        contactNumber,
        dateAdded,
        role: 'admin',
        password,
      });

      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setContactNumber('');

      setSuccessMessage('Admin added to database successfully!');
      setSuccessVisible(true);
    } catch (e) {
      console.error('Error adding admin:', e);
      setErrorMessage(e.message || 'Failed to add admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAdmin = async () => {
    setConfirmDeleteVisible(false);
    setIsProcessing(true);

    try {
      const admin = pendingDelete;
      const db = getDatabase();

      await remove(ref(db, 'Users/Admin/' + admin.id));

      setSuccessMessage('Admin removed from database successfully!');
      setSuccessVisible(true);
    } catch (e) {
      console.error('Error deleting admin:', e);
      setErrorMessage(e.message || 'Failed to delete admin');
      setErrorModalVisible(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const callApiAddAdmin = async () => {
    try {
      const { firstName, middleName, lastName, email } = pendingAdd;
      const password = generateRandomPassword();

      const adminDataForApi = {
        firstName,
        middleName,
        lastName,
        email,
        password,
      };

      // Replace with your actual API call
      // const response = await sendAdminCredentialsEmail(adminDataForApi);
      // if (response.error) throw new Error(response.error);
    } catch (e) {
      console.error('API error sending admin credentials:', e);
      throw e;
    }
  };

  const callApiDeleteAdmin = async () => {
    try {
      const admin = pendingDelete;
      const [fn, ...others] = admin.name.split(' ');
      const ln = others.pop();
      const mn = others.join(' ');

      const adminDeletePayload = {
        firstName: fn,
        middleName: mn,
        lastName: ln,
        email: admin.email,
      };

      // Replace with your actual API call
      // const response = await sendAdminDeleteData(adminDeletePayload);
      // if (response?.error) throw new Error(response.error);
    } catch (e) {
      console.error('API error sending admin delete data:', e);
      throw e;
    }
  };

  const deleteAuthUser = async (admin) => {
    try {
      const tempApp = initializeApp(
        {
          apiKey: 'AIzaSyCzINc7Pkozyowkhiocxr2UWvzabzDs0Lo',
          authDomain: 'ki-82889.firebaseapp.com',
          projectId: 'ki-82889',
          storageBucket: 'ki-82889.appspot.com',
          messagingSenderId: '442370396512',
          appId: '1:442370396512:web:e6271c043fc3295ee44e05',
          measurementId: 'G-FNCX3QBYWB',
        },
        'TempApp' + Date.now()
      );

      const tempAuth = getAuth(tempApp);
      const adminCred = await signInWithEmailAndPassword(
        tempAuth,
        admin.email,
        admin.password
      );
      await deleteUser(adminCred.user);
      await tempApp.delete();
    } catch (e) {
      console.error('Error deleting auth user:', e);
      throw e;
    }
  };

  const handleSuccessOk = () => {
    setSuccessVisible(false);

    if (pendingAdd) {
      callApiAddAdmin()
        .then(() => {
          setPendingAdd(null);
        })
        .catch((err) => {
          console.error('Background API add admin error:', err);
        });
    } else if (pendingDelete) {
      deleteAuthUser(pendingDelete)
        .then(() => callApiDeleteAdmin())
        .then(() => {
          setPendingDelete(null);
        })
        .catch((err) => {
          console.error('Background API delete admin error:', err);
        });
    }
  };

  const downloadCSV = () => {
    const header = ['ID', 'Name', 'Email', 'Contact Number', 'Date Added'];
    const rows = admins.map((a) => [
      a.id,
      a.name,
      a.email,
      a.contactNumber,
      a.dateAdded,
    ]);
    const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admins.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loadingView">
        <div className="spinner"></div>
      </div>
    );
  }

  const hasErrors =
    firstNameError || lastNameError || emailError || contactNumberError;

  return (
    <div className="safeAreaView">
      <div className="mainContainer">
        <h1 className="headerText">Admins</h1>

        <div className="topControls">
          <button
            onClick={() => setModalVisible(true)}
            className="createButton"
          >
            <span className="createButtonText">Create New Admin</span>
          </button>

          <div className="searchDownloadContainer">
            <div className="searchBar">
              <input
                className="searchInput"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="searchIcon">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
            <button onClick={downloadCSV} className="downloadIcon">
              <FontAwesomeIcon icon={faDownload} />
            </button>
          </div>
        </div>

        <div className="tableContainer">
          <table>
            <thead>
              <tr className="tableHeader">
                {tableHead.map((head, index) => (
                  <th key={index} className="tableHeaderText">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className={`row ${index % 2 === 0 ? 'evenRow' : 'oddRow'}`}
                >
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdmins.length > 0 && (
          <div className="paginationContainer">
            <span className="paginationInfo">{`Page ${currentPage + 1} of ${Math.ceil(
              filteredAdmins.length / pageSize
            )}`}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              className={`paginationButton ${
                currentPage === 0 ? 'disabledButton' : ''
              }`}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    Math.ceil(filteredAdmins.length / pageSize) - 1
                  )
                )
              }
              disabled={
                currentPage === Math.ceil(filteredAdmins.length / pageSize) - 1
              }
              className={`paginationButton ${
                currentPage === Math.ceil(filteredAdmins.length / pageSize) - 1
                  ? 'disabledButton'
                  : ''
              }`}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        )}
      </div>

      {modalVisible && (
        <div className="modalOverlay">
          <div
            className="modalContainer"
            style={isSmallScreen ? { width: '90%' } : { width: '35%' }}
          >
            <button
              onClick={() => setModalVisible(false)}
              className="closeButton"
            >
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
            <h2 className="modalTitle">New Admin</h2>

            <div className="modalScroll">
              <div className="inputGroup">
                <label className="label">
                  First Name
                  <span className="required"> *</span>
                </label>
                <input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                  autoCapitalize="words"
                />
                {firstNameError && (
                  <span className="errorText">{firstNameError}</span>
                )}
              </div>

              <div className="inputGroup">
                <label className="label">Middle Name</label>
                <input
                  placeholder="Middle Name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="input"
                  autoCapitalize="words"
                />
              </div>

              <div className="inputGroup">
                <label className="label">
                  Last Name
                  <span className="required"> *</span>
                </label>
                <input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                  autoCapitalize="words"
                />
                {lastNameError && (
                  <span className="errorText">{lastNameError}</span>
                )}
              </div>

              <div className="inputGroup">
                <label className="label">
                  Email
                  <span className="required"> *</span>
                </label>
                <input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  type="email"
                  autoCapitalize="none"
                />
                {emailError && <span className="errorText">{emailError}</span>}
              </div>

              <div className="inputGroup">
                <label className="label">
                  Contact Number
                  <span className="required"> *</span>
                </label>
                <input
                  placeholder="Contact Number"
                  value={contactNumber}
                  onChange={(e) => {
                    const numericText = e.target.value
                      .replace(/[^0-9]/g, '')
                      .slice(0, 11);
                    setContactNumber(numericText);
                  }}
                  className="input"
                  type="tel"
                />
                {contactNumberError && (
                  <span className="errorText">{contactNumberError}</span>
                )}
              </div>

              {hasErrors && (
                <div className="errorContainer">
                  <span className="generalErrorText">
                    Fill all required fields
                  </span>
                </div>
              )}

              <div className="modalButtonContainer">
                <button className="addButton" onClick={onPressAdd}>
                  <span className="addButtonText">Add Admin</span>
                </button>
                <button
                  className="cancelButton"
                  onClick={() => setModalVisible(false)}
                >
                  <span className="cancelButtonText">Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adminModalVisible && (
        <div className="centeredModal">
          <div
            className="modalCard"
            style={isSmallScreen ? { width: '90%' } : { width: '35%' }}
          >
            <button onClick={closeAdminModal} className="closeButton">
              <FontAwesomeIcon icon={faCircleXmark} />
            </button>
            <div className="modalContent">
              <h2 className="modalTitle">Admin Details</h2>
              {selectedAdmin &&
                [
                  ['ID', selectedAdmin.id],
                  ['Name', selectedAdmin.name],
                  ['Email', selectedAdmin.email],
                  ['Contact Number', selectedAdmin.contactNumber],
                  ['Date Added', selectedAdmin.dateAdded],
                ].map(([label, value]) => (
                  <p key={label} className="modalDetailText">
                    {label}: {value || 'N/A'}
                  </p>
                ))}
              <div className="actionButtonsContainer">
                <button
                  className="deleteButton"
                  onClick={() => {
                    setPendingDelete(selectedAdmin);
                    setConfirmDeleteVisible(true);
                    closeAdminModal();
                  }}
                >
                  <span className="deleteButtonText">Delete Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmAddVisible && (
        <div className="centeredModal">
          <div className="modalCardSmall">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="confirmIcon warning"
            />
            <p className="modalText">
              Are you sure you want to ADD this admin?
            </p>
            <div className="bottomButtons">
              <button className="confirmBtn" onClick={handleAddAdmin}>
                <span className="buttonText">Yes</span>
              </button>
              <button
                className="cancelBtn"
                onClick={() => setConfirmAddVisible(false)}
              >
                <span className="buttonText">No</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteVisible && (
        <div className="centeredModal">
          <div className="modalCardSmall">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="confirmIcon warning"
            />
            <p className="modalText">
              Are you sure you want to DELETE this admin?
            </p>
            <div className="bottomButtons">
              <button className="confirmBtn" onClick={handleDeleteAdmin}>
                <span className="buttonText">Yes</span>
              </button>
              <button
                className="cancelBtn"
                onClick={() => setConfirmDeleteVisible(false)}
              >
                <span className="buttonText">No</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {successVisible && (
        <div className="centeredModal">
          <div className="modalCardSmall">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="confirmIcon success"
            />
            <p className="modalText">{successMessage}</p>
            <button className="confirmBtn" onClick={handleSuccessOk}>
              <span className="buttonText">OK</span>
            </button>
          </div>
        </div>
      )}

      {errorModalVisible && (
        <div className="centeredModal">
          <div className="modalCardSmall">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="confirmIcon error"
            />
            <p className="modalText">{errorMessage}</p>
            <button
              className="cancelBtn"
              onClick={() => setErrorModalVisible(false)}
            >
              <span className="buttonText">OK</span>
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="centeredModal">
          <div className="spinner"></div>
        </div>
      )}

      <style jsx>{`
        .safeAreaView {
          flex: 1;
          background-color: #f5f5f5;
          min-height: 100vh;
        }

        .mainContainer {
          flex: 1;
          padding: 10px;
          margin-top: 70px;
        }

        .headerText {
          font-weight: bold;
          font-size: 40px;
          margin-bottom: 10px;
          margin-left: 25px;
          margin-right: 25px;
        }

        .loadingView {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }

        .spinner {
          border: 4px solid rgba(0, 31, 63, 0.1);
          border-radius: 50%;
          border-top: 4px solid #001f3f;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .topControls {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin: 0 25px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .createButton {
          background-color: #2d5783;
          padding: 0 16px;
          border-radius: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 40px;
          border: none;
          cursor: pointer;
        }

        .createButtonText {
          color: #fff;
          font-size: 14px;
          font-weight: bold;
        }

        .searchDownloadContainer {
          display: flex;
          flex-direction: row;
          align-items: center;
        }

        .searchBar {
          display: flex;
          flex-direction: row;
          border: 1px solid #ccc;
          border-radius: 25px;
          background-color: #fff;
          padding: 0 10px;
          align-items: center;
          margin-right: 10px;
          height: 40px;
        }

        .searchInput {
          height: 36px;
          width: 200px;
          font-size: 16px;
          padding-left: 8px;
          border: none;
          outline: none;
        }

        .searchIcon {
          padding: 4px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .downloadIcon {
          padding: 6px;
          background: none;
          border: none;
          cursor: pointer;
          color: #001f3f;
        }

        .tableContainer {
          flex: 1;
          margin: 0 25px;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 10px;
          width: calc(100% - 50px);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        .tableHeader {
          height: 50px;
          background-color: #2d5783;
        }

        .tableHeader th {
          color: #fff;
          font-weight: bold;
          font-size: 16px;
          text-align: center;
        }

        .row {
          height: 50px;
        }

        .evenRow {
          background-color: #d9d9d9;
        }

        .oddRow {
          background-color: #f5f5f5;
        }

        .rowText {
          text-align: center;
          font-size: 14px;
        }

        .cellCenter {
          display: flex;
          flex: 1;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        .actionsRow {
          display: flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }

        .viewButton {
          background-color: #5a8db8;
          padding: 0 10px;
          border-radius: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 30px;
          border: none;
          cursor: pointer;
        }

        .viewButtonText {
          color: #fff;
          font-size: 12px;
          font-weight: bold;
        }

        .paginationContainer {
          display: flex;
          flex-direction: row;
          justify-content: flex-end;
          margin: 0 25px;
          margin-top: 10px;
          align-items: center;
        }

        .paginationInfo {
          font-size: 12px;
          margin-right: 10px;
        }

        .paginationButton {
          padding: 5px;
          background-color: #001f3f;
          border-radius: 5px;
          margin: 0 3px;
          border: none;
          cursor: pointer;
          color: white;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .disabledButton {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .modalOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modalContainer {
          max-height: 80%;
          background-color: #f9f9f9;
          padding: 24px;
          border-radius: 10px;
          overflow-y: auto;
        }

        .modalTitle {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #001f3f;
          text-align: center;
        }

        .label {
          font-weight: 600;
          margin-bottom: 4px;
          color: #001f3f;
          display: block;
        }

        .input {
          border: 1px solid #ccc;
          border-radius: 6px;
          padding: 10px;
          background-color: #fff;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: 4px;
        }

        .errorText {
          color: red;
          font-size: 12px;
          margin-top: 4px;
        }

        .generalErrorText {
          color: red;
          font-size: 12px;
          text-align: center;
          margin-bottom: 10px;
        }

        .errorContainer {
          margin-bottom: 10px;
          display: flex;
          justify-content: center;
        }

        .modalButtonContainer {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin-top: 24px;
        }

        .cancelButton {
          background-color: #ccc;
          padding: 12px;
          border-radius: 8px;
          width: 48%;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
        }

        .cancelButtonText {
          color: #333;
          font-weight: bold;
        }

        .addButton {
          background-color: #2d5783;
          padding: 12px;
          border-radius: 8px;
          width: 48%;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
        }

        .addButtonText {
          color: #fff;
          font-weight: bold;
        }

        .required {
          color: red;
        }

        .centeredModal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modalCard {
          max-height: 90%;
          background-color: #d9d9d9;
          border-radius: 10px;
          padding: 20px;
          overflow-y: auto;
        }

        .modalCardSmall {
          width: 300px;
          min-height: 200px;
          background-color: #d9d9d9;
          border-radius: 10px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .modalContent {
          padding-bottom: 10px;
        }

        .modalDetailText {
          font-size: 14px;
          margin-bottom: 6px;
          color: #333;
          text-align: left;
          width: 100%;
        }

        .closeButton {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          padding: 5px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 20px;
        }

        .modalText {
          font-size: 14px;
          margin-bottom: 20px;
          text-align: center;
        }

        .confirmIcon {
          align-self: center;
          margin-bottom: 10px;
          font-size: 30px;
        }

        .confirmIcon.warning {
          color: #faad14;
        }

        .confirmIcon.success {
          color: #4caf50;
        }

        .confirmIcon.error {
          color: #f44336;
        }

        .bottomButtons {
          display: flex;
          flex-direction: row;
          justify-content: center;
          margin-top: 10px;
        }

        .confirmBtn {
          background-color: #4caf50;
          width: 100px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 5px;
          margin: 0 10px;
          border: none;
          cursor: pointer;
        }

        .cancelBtn {
          background-color: #f44336;
          width: 100px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 5px;
          margin: 0 10px;
          border: none;
          cursor: pointer;
        }

        .buttonText {
          color: #fff;
          font-weight: bold;
        }

        .actionButtonsContainer {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .deleteButton {
          background-color: #f44336;
          padding: 12px;
          border-radius: 8px;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
        }

        .deleteButtonText {
          color: #fff;
          font-weight: bold;
        }

        .inputGroup {
          margin-bottom: 12px;
        }

        .modalScroll {
          max-height: 70vh;
          overflow-y: auto;
          padding-right: 10px;
        }
      `}</style>
    </div>
  );
};

export default Admins;