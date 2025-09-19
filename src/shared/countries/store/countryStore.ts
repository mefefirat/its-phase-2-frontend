import { create } from 'zustand';
import { fetchCountries, fetchCountryById, fetchCountriesDropdown } from '../services/countries';
import type { Country } from '../types/country';

interface CountryState {
    countries: Country[];
    loading: boolean;
    fetchCountries: () => Promise<void>;
    fetchCountryById: (countryId: string) => Promise<Country>;
    fetchCountriesDropdown: () => Promise<Country[]>;
}

export const useCountryStore = create<CountryState>((set) => ({
    countries: [],
    loading: false,

    fetchCountries: async () => {
        set({ loading: true });
        try {
            const response = await fetchCountries();
            set({ countries: response.data.data || [] });
        } catch (error) {
            console.error('Failed to fetch countries', error);
            set({ countries: [] });
        } finally {
            set({ loading: false });
        }
    },

    fetchCountryById: async (countryId) => {
        try {
            const response = await fetchCountryById(countryId);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch country by id', error);
            throw error;
        }
    },

    fetchCountriesDropdown: async () => {
        const response = await fetchCountriesDropdown();
        return response.data;
    }
})); 