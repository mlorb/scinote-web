class CreateSamplesTables < ActiveRecord::Migration

  @@default_status = [{ name: 'Assigned',
                      visibility: true,
                      position: 1 },
                    { name: 'Sample name',
                      visibility: true,
                      position: 2 },
                    { name: 'Sample type',
                      visibility: true,
                      position: 3 },
                    { name: 'Sample group',
                      visibility: true,
                      position: 4 },
                    { name: 'Added on',
                      visibility: true,
                      position: 5 },
                    { name: 'Added by',
                      visibility: true,
                      position: 6 }]

  def change
    create_table :samples_tables do |t|
      t.jsonb :status, null: false, default: @@default_status
      # Foreign keys
      t.references :user, null: false
      t.references :organization, null: false

      t.timestamps null: false
    end
    # add_index :samples_tables, :status, using: :gin
    add_index :samples_tables, :user_id
    add_index :samples_tables, :organization_id

    User.find_each do |user|
      next unless user.organizations
      user.organizations.find_each do |org|
        org_status = @@default_status

        next unless org.custom_fields
        org.custom_fields.each_with_index do |cf, index|
          org_status << { name: cf.name,
                          visibility: true,
                          position: (7 + index) }
        end
        SamplesTable.create(user: user, organization: org, status: org_status)
      end
    end
  end
end
