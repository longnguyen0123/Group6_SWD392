import { get, post } from './api';

export const fetchAuditLogs = () => get('/auditLogs');
export const writeAuditLog = (payload) => post('/auditLogs', payload);


