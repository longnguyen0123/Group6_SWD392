import { get, post, put, patch, del } from './api';

export const fetchBikes = () => get('/bikes');
export const fetchBikeModels = () => get('/bikeModels');
export const addBike = (bike) => post('/bikes', bike);
export const updateBike = (id, body) => put(`/bikes/${id}`, body);
export const patchBike = (id, body) => patch(`/bikes/${id}`, body);
export const deleteBike = (id) => del(`/bikes/${id}`);


