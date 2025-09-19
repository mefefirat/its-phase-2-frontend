import axiosInstance from '@/config/axios';
import type { Country } from '../types/country';

interface CountriesResponse {
    data: Country[];
    total: number;
    page: number;
}

export const fetchCountries = async () => {
    const response = await axiosInstance.get<CountriesResponse>('/v1/countries');
    return response;
};

export const fetchCountryById = async (countryId: string) => {
    const response = await axiosInstance.get<Country>(`/v1/countries/${countryId}`);
    return response;
}; 


export const fetchCountriesDropdown = async () => {
    const response = await axiosInstance.get<Country[]>(`/v1/countries/dropdown`);
    return response;
}; 