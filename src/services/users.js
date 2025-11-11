import { get, post, put, patch } from './api';

export const fetchUsers = () => get('/users');
export const fetchUserById = (id) => get(`/users/${id}`);
export const createUser = (user) => post('/users', user);
export const updateUser = (id, body) => put(`/users/${id}`, body);
export const patchUser = (id, body) => patch(`/users/${id}`, body);


