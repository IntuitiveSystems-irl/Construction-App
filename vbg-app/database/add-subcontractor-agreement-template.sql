-- Add Subcontractor Services Agreement template to contract_templates table

INSERT INTO contract_templates (
  name,
  description,
  template_content,
  placeholders,
  is_active,
  created_at
) VALUES (
  'Subcontractor Services Agreement',
  'Agreement between Veritas Building Group and subcontractors for construction services',
  readfile('contract-templates/subcontractor-services-agreement.txt'),
  json_array(
    'day',
    'month',
    'year',
    'subcontractor_company_name',
    'subcontractor_state',
    'subcontractor_entity_type',
    'end_customer_name',
    'underlying_agreement_day',
    'underlying_agreement_month',
    'underlying_agreement_year',
    'contract_amount',
    'subcontractor_license',
    'subcontractor_contact_name',
    'subcontractor_contact_title',
    'services_description',
    'estimate_number'
  ),
  1,
  datetime('now')
);
