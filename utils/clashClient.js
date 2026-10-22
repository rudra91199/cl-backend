import { Client } from 'clashofclans.js';

export const clashClient = new Client();

export const initClashClient = async () => {
  try {
    await clashClient.login({
      email: process.env.COC_EMAIL,
      password: process.env.COC_PASSWORD
    });
    console.log('Successfully authenticated with Supercell API!');
  } catch (error) {
    console.error('API Authentication Failed:', error);
  }
};

export const formatTag = (tag) => (tag.startsWith('#') ? tag : `#${tag}`);