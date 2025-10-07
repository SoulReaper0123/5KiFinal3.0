import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaSave, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { AiOutlineClose } from 'react-icons/ai';
import { database, auth, storage } from '../../../../Database/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendMemberCredentialsEmail } from '../../../../Server/api';

// Options (match Register.jsx)
const genderOptions = [
  { key: 'Male', label: 'Male' },
  { key: 'Female', label: 'Female' }
];

const civilStatusOptions = [
  { key: 'Single', label: 'Single' },
  { key: 'Married', label: 'Married' },
  { key: 'Widowed', label: 'Widowed' },
  { key: 'Separated', label: 'Separated' }
];

const governmentIdOptions = [
  { key: 'national', label: 'National ID (PhilSys)' },
  { key: 'sss', label: 'SSS ID' },
  { key: 'philhealth', label: 'PhilHealth ID' },
  { key: 'drivers_license', label: 'Drivers License' }
];

// Modal styles copied to match Register.jsx
const modalStyles = {
  centeredModal: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  },
  modalCard: {
    width: '40%', maxWidth: '800px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '90vh', height: '80vh', display: 'flex', flexDirection: 'column'
  },
  closeButton: {
    position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', fontSize: '18px', color: 'grey', backgroundColor: 'transparent', border: 'none', padding: '4px', outline: 'none'
  },
  modalHeader: { borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '12px' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#2D5783', textAlign: 'center' },
  modalContent: { paddingBottom: '12px', overflowY: 'auto', flex: 1 },
  formColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1 },
  formColumn: { display: 'flex', flexDirection: 'column' },
  formGroup: { marginBottom: '20px', width: '100%' },
  formLabel: { fontWeight: 600, marginBottom: '5px', display: 'block', fontSize: 14, color: '#333' },
  requiredAsterisk: { color: 'red', marginLeft: '3px' },
  formInput: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', fontSize: '14px' },
  formSelect: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: 'white', fontSize: '14px' },
  fileInputLabel: { display: 'block', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f8f9fa', cursor: 'pointer', textAlign: 'center', fontSize: '14px', color: '#495057' },
  fileInput: { display: 'none' },
  bottomButtons: { display: 'flex', justifyContent: 'center', marginTop: '16px', gap: '12px', paddingTop: '12px', borderTop: '1px solid #eee' },
  actionButton: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s', minWidth: '100px', outline: 'none' }
};

const tableStyles = {
  tableContainer: { borderRadius: 8, overflow: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 900 },
  tableHeader: { backgroundColor: '#2D5783', color: '#fff', height: 50, textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  tableHeaderCell: { whiteSpace: 'nowrap' },
  tableRow: { height: 50 },
  tableCell: { textAlign: 'center', fontSize: 14, borderBottom: '1px solid #ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  viewText: { color: '#2D5783', fontSize: 14, textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }
};

const emptyForm = {
  email: '', phoneNumber: '', firstName: '', middleName: '', lastName: '',
  gender: '', civilStatus: '', age: '', dateOfBirth: '', placeOfBirth: '', address: '',
  governmentId: '', registrationFee: '', balance: '', loans: ''
};

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let pwd = ''; for (let i = 0; i < 6; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/\d/.test(pwd)) return generateRandomPassword();
  return pwd;
};

const MembersManagement = () => {
  // Data
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minRegistrationFee, setMinRegistrationFee] = useState(5000);

  // Pagination
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(0);

  // Add/Edit modal
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Files
  const [validIdFrontFile, setValidIdFrontFile] = useState(null);
  const [validIdBackFile, setValidIdBackFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfieWithIdFile, setSelfieWithIdFile] = useState(null);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState(null);

  // UX
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Inject page styles that mimic Admins.jsx header/controls
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      .safe-area-view { flex: 1; background-color: #F5F5F5; height: 100%; width: 100%; overflow: auto; }
      .main-container { flex: 1; }
      .header-text { font-weight: bold; font-size: 40px; margin-bottom: 10px; margin-left: 25px; margin-right: 25px; margin-top: 100px; }
      .top-controls { display: flex; justify-content: space-between; margin: 0 25px; align-items: center; flex-wrap: wrap; gap: 10px; }
      .search-download-container { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
      .search-bar { display: flex; border: 1px solid #ccc; border-radius: 25px; background-color: #fff; padding: 0 10px; align-items: center; height: 40px; width: 250px; }
      .search-input { height: 36px; width: 100%; font-size: 16px; padding-left: 8px; border: none; outline: none; background: transparent; }
      .search-icon { padding: 4px; background: none; border: none; cursor: pointer; color: #666; }
      .create-button { background-color: #2D5783; padding: 0 16px; border-radius: 30px; display: flex; justify-content: center; align-items: center; height: 40px; border: none; cursor: pointer; }
      .create-button-text { color: #fff; font-size: 14px; font-weight: bold; }
      .pagination-container { display: flex; justify-content: flex-end; margin: 0 25px; margin-top: 10px; align-items: center; }
      .pagination-info { font-size: 12px; margin-right: 10px; color: #333; }
      .pagination-button { padding: 0; background-color: #2D5783; border-radius: 5px; margin: 0 3px; color: white; border: none; cursor: pointer; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; }
      .pagination-button svg { font-size: 10px; display: block; margin: 0 auto; }
      .disabled-button { background-color: #ccc; cursor: not-allowed; }
      .data-container { flex: 1; margin: 0 25px; margin-top: 10px; background-color: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .no-match-text { text-align: center; margin-top: 20px; font-size: 16px; color: #666; }
    `;
    document.head.appendChild(styleEl);

    (async () => {
      try {
        const feeSnap = await database.ref('Settings/RegistrationMinimumFee').once('value');
        const val = feeSnap.val();
        const num = parseFloat(val);
        if (!isNaN(num)) setMinRegistrationFee(num);
      } catch (_) {}

      await fetchMembers();
    })();

    return () => { document.head.removeChild(styleEl); };
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snap = await database.ref('Members').once('value');
      const data = snap.val() || {};
      const list = Object.values(data).sort((a, b) => Number(a.id) - Number(b.id));
      setMembers(list);
    } catch (e) {
      console.error(e);
      setMessage('Failed to load members');
    } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(m => (
      `${m.firstName || ''} ${m.middleName || ''} ${m.lastName || ''}`.toLowerCase().includes(q) ||
      `${m.email || ''}`.toLowerCase().includes(q) || `${m.phoneNumber || ''}`.toLowerCase().includes(q) || String(m.id || '').includes(q)
    ));
  }, [search, members]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  useEffect(() => { if (currentPage > totalPages - 1) setCurrentPage(0); }, [totalPages]);

  const toPeso = (n) => `₱${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const openAdd = () => {
    setForm({ ...emptyForm, registrationFee: String(minRegistrationFee) });
    setValidIdFrontFile(null); setValidIdBackFile(null); setSelfieFile(null); setSelfieWithIdFile(null); setProofOfPaymentFile(null);
    setAddOpen(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setForm({
      email: member.email || '',
      phoneNumber: member.phoneNumber || '',
      firstName: member.firstName || '',
      middleName: member.middleName || '',
      lastName: member.lastName || '',
      gender: member.gender || '',
      civilStatus: member.civilStatus || '',
      age: member.age || '',
      dateOfBirth: member.dateOfBirth || '',
      placeOfBirth: member.placeOfBirth || '',
      address: member.address || '',
      governmentId: member.governmentId || '',
      registrationFee: String(member.registrationFee ?? minRegistrationFee),
      balance: String(member.balance ?? 0),
      loans: String(member.loans ?? 0)
    });
    setValidIdFrontFile(null); setValidIdBackFile(null); setSelfieFile(null); setSelfieWithIdFile(null); setProofOfPaymentFile(null);
    setEditOpen(true);
  };

  const closeModals = () => { setAddOpen(false); setEditOpen(false); setEditingMember(null); setMessage(''); };

  // Upload helper
  const uploadImageToStorage = async (file, path) => {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  // Compute next available numeric member id starting at 5001
  const getNextMemberId = async () => {
    const membersSnap = await database.ref('Members').once('value');
    const membersData = membersSnap.val() || {};
    const existingIds = Object.keys(membersData).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
    let newId = 5001; for (const id of existingIds) { if (id === newId) newId++; else if (id > newId) break; }
    return newId;
  };

  // Add member (Register.jsx flow + same layout)
  const onSubmitAdd = async () => {
    setBusy(true); setMessage('');
    try {
      if (!form.email || !form.firstName || !form.lastName || !form.phoneNumber || !form.placeOfBirth || !form.gender || !form.dateOfBirth || !form.address || !form.age || !form.civilStatus || !form.governmentId) {
        throw new Error('Please complete all required fields.');
      }
      if (!validIdFrontFile || !validIdBackFile || !selfieFile || !selfieWithIdFile || !proofOfPaymentFile) throw new Error('Please upload all required images/documents.');

      const password = generateRandomPassword();
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, password);
      const userId = userCredential.user.uid;

      const newId = await getNextMemberId();

      const now = new Date();
      const dateAdded = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const timeAdded = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

      // Upload images
      const validIdFrontUrl = await uploadImageToStorage(validIdFrontFile, `member_docs/${newId}/valid_id_front_${Date.now()}`);
      const validIdBackUrl  = await uploadImageToStorage(validIdBackFile,  `member_docs/${newId}/valid_id_back_${Date.now()}`);
      const selfieUrl       = await uploadImageToStorage(selfieFile,       `member_docs/${newId}/selfie_${Date.now()}`);
      const selfieWithIdUrl = await uploadImageToStorage(selfieWithIdFile, `member_docs/${newId}/selfie_with_id_${Date.now()}`);
      const proofOfPaymentUrl = await uploadImageToStorage(proofOfPaymentFile, `member_docs/${newId}/registration_payment_proof_${Date.now()}`);

      const memberData = {
        id: newId, authUid: userId, email: form.email,
        firstName: form.firstName, middleName: form.middleName || '', lastName: form.lastName,
        phoneNumber: form.phoneNumber, gender: form.gender, civilStatus: form.civilStatus,
        age: form.age, dateOfBirth: form.dateOfBirth, placeOfBirth: form.placeOfBirth, address: form.address,
        governmentId: form.governmentId,
        dateAdded, timeAdded, status: 'active',
        balance: 0.0, loans: 0.0,
        validIdFront: validIdFrontUrl, validIdBack: validIdBackUrl,
        selfie: selfieUrl, selfieWithId: selfieWithIdUrl,
        registrationFee: parseFloat(form.registrationFee || minRegistrationFee),
        registrationPaymentProof: proofOfPaymentUrl
      };

      await database.ref(`Members/${newId}`).set(memberData);

      await sendMemberCredentialsEmail({
        firstName: memberData.firstName, lastName: memberData.lastName,
        email: memberData.email, password, memberId: memberData.id, dateAdded: memberData.dateAdded
      });

      setMessage('Member added successfully.');
      closeModals();
      await fetchMembers();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to add member');
    } finally { setBusy(false); }
  };

  // Edit member (update fields; optionally replace images). Balance and Loans editable here.
  const onSubmitEdit = async () => {
    if (!editingMember) return;
    setBusy(true); setMessage('');
    try {
      const id = editingMember.id;
      const updates = {
        phoneNumber: form.phoneNumber || '', firstName: form.firstName || '', middleName: form.middleName || '', lastName: form.lastName || '',
        gender: form.gender || '', civilStatus: form.civilStatus || '', age: form.age || '', dateOfBirth: form.dateOfBirth || '',
        placeOfBirth: form.placeOfBirth || '', address: form.address || '', governmentId: form.governmentId || '',
        registrationFee: parseFloat(form.registrationFee || editingMember.registrationFee || 0),
        balance: parseFloat(form.balance || editingMember.balance || 0),
        loans: parseFloat(form.loans || editingMember.loans || 0)
      };

      if (validIdFrontFile) updates.validIdFront = await uploadImageToStorage(validIdFrontFile, `member_docs/${id}/valid_id_front_${Date.now()}`);
      if (validIdBackFile)  updates.validIdBack  = await uploadImageToStorage(validIdBackFile,  `member_docs/${id}/valid_id_back_${Date.now()}`);
      if (selfieFile)       updates.selfie       = await uploadImageToStorage(selfieFile,       `member_docs/${id}/selfie_${Date.now()}`);
      if (selfieWithIdFile) updates.selfieWithId = await uploadImageToStorage(selfieWithIdFile, `member_docs/${id}/selfie_with_id_${Date.now()}`);
      if (proofOfPaymentFile) updates.registrationPaymentProof = await uploadImageToStorage(proofOfPaymentFile, `member_docs/${id}/registration_payment_proof_${Date.now()}`);

      await database.ref(`Members/${id}`).update(updates);

      setMessage('Member updated successfully.');
      closeModals();
      await fetchMembers();
    } catch (e) {
      console.error(e);
      setMessage(e.message || 'Failed to update member');
    } finally { setBusy(false); }
  };

  const renderModal = (mode /* 'add' | 'edit' */) => (
    <div style={modalStyles.centeredModal}>
      <div style={modalStyles.modalCard}>
        <button style={modalStyles.closeButton} onClick={closeModals} aria-label="Close">
          <AiOutlineClose />
        </button>
        <div style={modalStyles.modalHeader}>
          <h2 style={modalStyles.modalTitle}>{mode === 'add' ? 'New Member' : `Edit Member #${editingMember?.id}`}</h2>
        </div>
        <div style={modalStyles.modalContent}>
          <div style={modalStyles.formColumns}>
            {/* Left Column (match Register.jsx order) */}
            <div style={modalStyles.formColumn}>
              {mode === 'add' ? (
                <>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>First Name<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Last Name<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Email<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Birth Place<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Birth Place" value={form.placeOfBirth} onChange={e => setForm({ ...form, placeOfBirth: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Gender<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <select style={modalStyles.formSelect} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select Gender</option>
                      {genderOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Date of Birth<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Valid ID Front<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <label style={modalStyles.fileInputLabel}>
                      {validIdFrontFile ? validIdFrontFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setValidIdFrontFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Selfie<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <label style={modalStyles.fileInputLabel}>
                      {selfieFile ? selfieFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Registration Fee (min {toPeso(minRegistrationFee)})<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder={`Enter amount (min ${toPeso(minRegistrationFee)})`} type="number" min={minRegistrationFee} step="0.01" value={form.registrationFee} onChange={e => setForm({ ...form, registrationFee: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>First Name<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Last Name<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Email</label>
                    <input disabled style={modalStyles.formInput} type="email" value={form.email} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Birth Place<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Birth Place" value={form.placeOfBirth} onChange={e => setForm({ ...form, placeOfBirth: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Gender<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <select style={modalStyles.formSelect} value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select Gender</option>
                      {genderOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Date of Birth<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Valid ID Front</label>
                    <label style={modalStyles.fileInputLabel}>
                      {validIdFrontFile ? validIdFrontFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setValidIdFrontFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Selfie</label>
                    <label style={modalStyles.fileInputLabel}>
                      {selfieFile ? selfieFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Registration Fee</label>
                    <input style={modalStyles.formInput} type="number" step="0.01" value={form.registrationFee} onChange={e => setForm({ ...form, registrationFee: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Balance</label>
                    <input style={modalStyles.formInput} type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Loans</label>
                    <input style={modalStyles.formInput} type="number" step="0.01" value={form.loans} onChange={e => setForm({ ...form, loans: e.target.value })} />
                  </div>
                </>
              )}
            </div>

            {/* Right Column (match Register.jsx order) */}
            <div style={modalStyles.formColumn}>
              {mode === 'add' ? (
                <>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Middle Name</label>
                    <input style={modalStyles.formInput} placeholder="Middle Name" value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Phone Number<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Phone Number" type="tel" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Address<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Age<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <input style={modalStyles.formInput} type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Civil Status<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <select style={modalStyles.formSelect} value={form.civilStatus} onChange={e => setForm({ ...form, civilStatus: e.target.value })}>
                      <option value="">Select Civil Status</option>
                      {civilStatusOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Government ID<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <select style={modalStyles.formSelect} value={form.governmentId} onChange={e => setForm({ ...form, governmentId: e.target.value })}>
                      <option value="">Select Government ID</option>
                      {governmentIdOptions.map(option => <option key={option.key} value={option.label}>{option.label}</option>)}
                    </select>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Valid ID Back<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <label style={modalStyles.fileInputLabel}>
                      {validIdBackFile ? validIdBackFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setValidIdBackFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Selfie with ID<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <label style={modalStyles.fileInputLabel}>
                      {selfieWithIdFile ? selfieWithIdFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setSelfieWithIdFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Proof of Payment<span style={modalStyles.requiredAsterisk}>*</span></label>
                    <label style={modalStyles.fileInputLabel}>
                      {proofOfPaymentFile ? proofOfPaymentFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*,application/pdf" onChange={e => setProofOfPaymentFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {/* Edit column right */}
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Middle Name</label>
                    <input style={modalStyles.formInput} value={form.middleName} onChange={e => setForm({ ...form, middleName: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Phone Number</label>
                    <input style={modalStyles.formInput} value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Address</label>
                    <input style={modalStyles.formInput} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Age</label>
                    <input style={modalStyles.formInput} type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Civil Status</label>
                    <select style={modalStyles.formSelect} value={form.civilStatus} onChange={e => setForm({ ...form, civilStatus: e.target.value })}>
                      <option value="">Select Civil Status</option>
                      {civilStatusOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                    </select>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Government ID</label>
                    <select style={modalStyles.formSelect} value={form.governmentId} onChange={e => setForm({ ...form, governmentId: e.target.value })}>
                      <option value="">Select Government ID</option>
                      {governmentIdOptions.map(option => <option key={option.key} value={option.label}>{option.label}</option>)}
                    </select>
                  </div>
                  {/* Optional replace documents */}
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Valid ID Front</label>
                    <label style={modalStyles.fileInputLabel}>
                      {validIdFrontFile ? validIdFrontFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setValidIdFrontFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Valid ID Back</label>
                    <label style={modalStyles.fileInputLabel}>
                      {validIdBackFile ? validIdBackFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setValidIdBackFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Selfie</label>
                    <label style={modalStyles.fileInputLabel}>
                      {selfieFile ? selfieFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Selfie with ID</label>
                    <label style={modalStyles.fileInputLabel}>
                      {selfieWithIdFile ? selfieWithIdFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*" onChange={e => setSelfieWithIdFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <div style={modalStyles.formGroup}>
                    <label style={modalStyles.formLabel}>Replace Proof of Payment</label>
                    <label style={modalStyles.fileInputLabel}>
                      {proofOfPaymentFile ? proofOfPaymentFile.name : 'Choose file'}
                      <input style={modalStyles.fileInput} type="file" accept="image/*,application/pdf" onChange={e => setProofOfPaymentFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={modalStyles.bottomButtons}>
            <button
              style={{ ...modalStyles.actionButton, backgroundColor: '#2D5783', color: '#FFF' }}
              onClick={mode === 'add' ? onSubmitAdd : onSubmitEdit}
              disabled={busy}
            >
              <FaSave /> {busy ? 'Saving...' : (mode === 'add' ? 'Add Member' : 'Update Member')}
            </button>
            <button
              style={{ ...modalStyles.actionButton, backgroundColor: '#6c757d', color: '#FFF' }}
              onClick={closeModals}
            >
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div style={{ border: '4px solid rgba(0,0,0,0.1)', borderLeftColor: '#2D5783', borderRadius: '50%', width: 36, height: 36, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const noMatch = filtered.length === 0;

  return (
    <div className="safe-area-view">
      <div className="main-container">
        <h2 className="header-text">Members</h2>

        <div className="top-controls">
          <button onClick={openAdd} className="create-button">
            <span className="create-button-text">Add Member</span>
          </button>

          <div className="search-download-container">
            <div className="search-bar">
              <input className="search-input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              <button className="search-icon"><FaSearch /></button>
            </div>
          </div>
        </div>

        {!noMatch && (
          <div className="pagination-container">
            <span className="pagination-info">{`Page ${currentPage + 1} of ${totalPages}`}</span>
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 0))} disabled={currentPage === 0} className={`pagination-button ${currentPage === 0 ? 'disabled-button' : ''}`}>
              <FaChevronLeft />
            </button>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages - 1))} disabled={currentPage === totalPages - 1} className={`pagination-button ${currentPage === totalPages - 1 ? 'disabled-button' : ''}`}>
              <FaChevronRight />
            </button>
          </div>
        )}

        <div className="data-container">
          {noMatch ? (
            <span className="no-match-text">No Matches Found</span>
          ) : (
            <div style={tableStyles.tableContainer}>
              <table style={tableStyles.table}>
                <thead>
                  <tr style={tableStyles.tableHeader}>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '10%' }}>ID</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '16%' }}>First Name</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '14%' }}>Middle Name</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '16%' }}>Last Name</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '18%' }}>Email</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '14%' }}>Phone</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '12%' }}>Balance</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '12%' }}>Loans</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '14%' }}>Date Added</th>
                    <th style={{ ...tableStyles.tableHeaderCell, width: '10%' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(m => (
                    <tr key={m.id} style={tableStyles.tableRow}>
                      <td style={tableStyles.tableCell}>{m.id}</td>
                      <td style={tableStyles.tableCell}>{m.firstName || 'N/A'}</td>
                      <td style={tableStyles.tableCell}>{m.middleName || 'N/A'}</td>
                      <td style={tableStyles.tableCell}>{m.lastName || 'N/A'}</td>
                      <td style={tableStyles.tableCell}>{m.email || 'N/A'}</td>
                      <td style={tableStyles.tableCell}>{m.phoneNumber || m.contactNumber || 'N/A'}</td>
                      <td style={tableStyles.tableCell}>{toPeso(m.balance)}</td>
                      <td style={tableStyles.tableCell}>{toPeso(m.loans)}</td>
                      <td style={tableStyles.tableCell}>{m.dateAdded || m.dateApproved ||'N/A'}</td>
                      <td style={tableStyles.tableCell}>
                        <span style={tableStyles.viewText} onClick={() => openEdit(m)}>Edit</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {addOpen && renderModal('add')}
        {editOpen && renderModal('edit')}
      </div>
    </div>
  );
};

export default MembersManagement;
