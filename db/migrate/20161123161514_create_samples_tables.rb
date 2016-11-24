class CreateSamplesTables < ActiveRecord::Migration
  def change
    create_table :samples_tables do |t|
      t.jsonb :preferences, null: false, default: '{}'
      # Foreign keys
      t.integer :user_id, null: false
      t.integer :organization_id, null: false

      t.timestamps null: false
    end
    add_foreign_key :samples_tables, :users
    add_foreign_key :samples_tables, :organizations
    # add_index :samples_tables, :preferences, using: :gin
    add_index :samples_tables, :user_id
    add_index :samples_tables, :organization_id

    User.find_each do |user|
      user.organizations.each do |org|
        uo_samples_table = SamplesTable.new(user: user, organization: org)
        uo_samples_table.save(validate: false)
      end
    end
  end
end
