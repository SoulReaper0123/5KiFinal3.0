# Remove Fields from Register New Member Form

## Fields to Remove:
- Civil Status*
- Gender*
- Age*
- Valid ID Back*
- Selfie with ID

## Tasks:
- [ ] Remove state variables: gender, civilStatus, age from formData
- [ ] Remove file state variables: validIdBackFile, selfieWithIdFile
- [ ] Remove form sections for Civil Status, Age, Valid ID Back, Selfie with ID
- [ ] Remove validation checks for gender, civilStatus
- [ ] Remove upload logic for validIdBack and selfieWithId files
- [ ] Remove these fields from member data object
- [ ] Update closeAddModal to not reset removed fields
- [ ] Remove unused constants (genderOptions, civilStatusOptions) if not used elsewhere
- [ ] Test the form submission works without these fields
