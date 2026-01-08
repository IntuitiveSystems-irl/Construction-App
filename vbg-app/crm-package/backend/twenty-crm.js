import dotenv from 'dotenv';

dotenv.config();

/**
 * Twenty CRM Integration Service
 * Handles all interactions with self-hosted Twenty CRM
 * API Documentation: https://twenty.com/developers
 */

const TWENTY_API_URL = process.env.TWENTY_API_URL || 'http://localhost:3000/graphql';
const TWENTY_API_KEY = process.env.TWENTY_API_KEY;

/**
 * Make a GraphQL request to Twenty CRM
 * @param {string} query - GraphQL query or mutation
 * @param {Object} variables - Variables for the query
 * @returns {Promise<Object>} - API response
 */
async function twentyRequest(query, variables = {}) {
  if (!TWENTY_API_KEY) {
    console.warn('[Twenty CRM] API key not configured, skipping CRM sync');
    return { success: false, message: 'CRM not configured' };
  }

  try {
    const response = await fetch(TWENTY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TWENTY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Twenty CRM] API request failed:', response.status, errorText);
      throw new Error(`Twenty CRM API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('[Twenty CRM] GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('[Twenty CRM] Request failed:', error);
    throw error;
  }
}

/**
 * Create a person (contact) in Twenty CRM
 * @param {Object} personData - Person details
 * @returns {Promise<Object>} - Created person data
 */
export async function createPerson(personData) {
  const { name, email, phone, userType, userId, companyName } = personData;

  // Split name into first and last name
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const mutation = `
    mutation CreatePerson($data: PersonCreateInput!) {
      createPerson(data: $data) {
        id
        name {
          firstName
          lastName
        }
        createdAt
      }
    }
  `;

  const variables = {
    data: {
      name: {
        firstName,
        lastName,
      },
    },
  };

  try {
    const result = await twentyRequest(mutation, variables);
    console.log('[Twenty CRM] Person created successfully:', result.data?.createPerson?.id);
    return result;
  } catch (error) {
    console.error('[Twenty CRM] Failed to create person:', error);
    throw error;
  }
}

/**
 * Create a company in Twenty CRM
 * @param {Object} companyData - Company details
 * @returns {Promise<Object>} - Created company data
 */
export async function createCompany(companyData) {
  const { name, email, phone, address, userId } = companyData;

  const mutation = `
    mutation CreateCompany($data: CompanyCreateInput!) {
      createCompany(data: $data) {
        id
        name
        domainName
        createdAt
      }
    }
  `;

  const variables = {
    data: {
      name,
      domainName: email ? email.split('@')[1] : null,
      customFields: {
        primaryEmail: email,
        primaryPhone: phone,
        address: address || null,
        vbgUserId: userId ? String(userId) : null,
        source: 'VBG Web App',
      },
    },
  };

  try {
    const result = await twentyRequest(mutation, variables);
    console.log('[Twenty CRM] Company created successfully:', result.data?.createCompany?.id);
    return result;
  } catch (error) {
    console.error('[Twenty CRM] Failed to create company:', error);
    throw error;
  }
}

/**
 * Update a person in Twenty CRM
 * @param {string} personId - Twenty CRM person ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} - Updated person data
 */
export async function updatePerson(personId, updateData) {
  const mutation = `
    mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
      updatePerson(where: { id: $id }, data: $data) {
        id
        name {
          firstName
          lastName
        }
        email
        phone
      }
    }
  `;

  const variables = {
    id: personId,
    data: updateData,
  };

  try {
    const result = await twentyRequest(mutation, variables);
    console.log('[Twenty CRM] Person updated successfully:', personId);
    return result;
  } catch (error) {
    console.error('[Twenty CRM] Failed to update person:', error);
    throw error;
  }
}

/**
 * Find a person by email in Twenty CRM
 * @param {string} email - Email to search for
 * @returns {Promise<Object|null>} - Person data or null if not found
 */
export async function findPersonByEmail(email) {
  const query = `
    query FindPerson {
      people {
        edges {
          node {
            id
            name {
              firstName
              lastName
            }
            emails {
              primaryEmail
            }
            phones {
              primaryPhoneNumber
            }
          }
        }
      }
    }
  `;

  try {
    const result = await twentyRequest(query);
    const people = result.data?.people?.edges || [];
    // Filter by email on the client side since where clause isn't supported
    const person = people.find(p => p.node.emails?.primaryEmail === email);
    return person ? person.node : null;
  } catch (error) {
    console.error('[Twenty CRM] Failed to find person:', error);
    return null;
  }
}

/**
 * Sync user to Twenty CRM (create or update)
 * @param {Object} userData - User data from VBG system
 * @returns {Promise<Object>} - Sync result
 */
export async function syncUserToCRM(userData) {
  const { id, name, email, phone, user_type, company_name, is_admin } = userData;

  try {
    // Check if person already exists
    const existingPerson = await findPersonByEmail(email);

    if (existingPerson) {
      console.log('[Twenty CRM] Person already exists, skipping:', email);
      return { success: true, action: 'skipped', personId: existingPerson.id };
    }

    // Create new person
    const personData = {
      name,
      email,
      phone: phone || null,
      userType: is_admin ? 'admin' : (user_type || 'subcontractor'),
      userId: id,
      companyName: company_name || null,
    };

    const result = await createPerson(personData);
    
    return {
      success: true,
      action: 'created',
      personId: result.data?.createPerson?.id,
    };
  } catch (error) {
    console.error('[Twenty CRM] Failed to sync user:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create a note/activity in Twenty CRM
 * @param {Object} noteData - Note details
 * @returns {Promise<Object>} - Created note data
 */
export async function createNote(noteData) {
  const { personId, title, body } = noteData;

  const mutation = `
    mutation CreateNote($data: NoteCreateInput!) {
      createNote(data: $data) {
        id
        title
        body
        createdAt
      }
    }
  `;

  const variables = {
    data: {
      title,
      body,
      person: {
        connect: {
          id: personId,
        },
      },
    },
  };

  try {
    const result = await twentyRequest(mutation, variables);
    console.log('[Twenty CRM] Note created successfully');
    return result;
  } catch (error) {
    console.error('[Twenty CRM] Failed to create note:', error);
    throw error;
  }
}

/**
 * Create an opportunity/deal in Twenty CRM
 * @param {Object} opportunityData - Opportunity details
 * @returns {Promise<Object>} - Created opportunity data
 */
export async function createOpportunity(opportunityData) {
  const { name, amount, stage, personId, companyId } = opportunityData;

  const mutation = `
    mutation CreateOpportunity($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) {
        id
        name
        amount
        stage
        createdAt
      }
    }
  `;

  const variables = {
    data: {
      name,
      amount: amount || null,
      stage: stage || 'NEW',
      person: personId ? { connect: { id: personId } } : null,
      company: companyId ? { connect: { id: companyId } } : null,
    },
  };

  try {
    const result = await twentyRequest(mutation, variables);
    console.log('[Twenty CRM] Opportunity created successfully');
    return result;
  } catch (error) {
    console.error('[Twenty CRM] Failed to create opportunity:', error);
    throw error;
  }
}

/**
 * Health check for Twenty CRM connection
 * @returns {Promise<boolean>} - True if connection is healthy
 */
export async function healthCheck() {
  if (!TWENTY_API_KEY) {
    console.warn('[Twenty CRM] API key not configured');
    return false;
  }

  const query = `
    query HealthCheck {
      __typename
    }
  `;

  try {
    await twentyRequest(query);
    console.log('[Twenty CRM] Health check passed');
    return true;
  } catch (error) {
    console.error('[Twenty CRM] Health check failed:', error);
    return false;
  }
}

/**
 * Fetch all people from Twenty CRM
 * @returns {Promise<Object>} - List of people
 */
export async function getAllPeople() {
  const query = `
    query GetAllPeople {
      people {
        edges {
          node {
            id
            name {
              firstName
              lastName
            }
            emails {
              primaryEmail
            }
            phones {
              primaryPhoneNumber
            }
            company {
              id
              name
            }
            createdAt
          }
        }
      }
    }
  `;

  try {
    const result = await twentyRequest(query);
    
    if (result.success === false) {
      return { success: false, people: [], message: result.message };
    }

    const people = result.data?.people?.edges?.map(edge => edge.node) || [];
    
    return {
      success: true,
      people,
      count: people.length
    };
  } catch (error) {
    console.error('[Twenty CRM] Error fetching people:', error);
    return {
      success: false,
      people: [],
      error: error.message
    };
  }
}

/**
 * Fetch all companies from Twenty CRM
 * @returns {Promise<Object>} - List of companies
 */
export async function getAllCompanies() {
  const query = `
    query GetAllCompanies {
      companies {
        edges {
          node {
            id
            name
            domainName
            employees
            createdAt
          }
        }
      }
    }
  `;

  try {
    const result = await twentyRequest(query);
    
    if (result.success === false) {
      return { success: false, companies: [], message: result.message };
    }

    const companies = result.data?.companies?.edges?.map(edge => edge.node) || [];
    
    return {
      success: true,
      companies,
      count: companies.length
    };
  } catch (error) {
    console.error('[Twenty CRM] Error fetching companies:', error);
    return {
      success: false,
      companies: [],
      error: error.message
    };
  }
}

export default {
  createPerson,
  createCompany,
  updatePerson,
  findPersonByEmail,
  syncUserToCRM,
  createNote,
  createOpportunity,
  healthCheck,
  getAllPeople,
  getAllCompanies
};
