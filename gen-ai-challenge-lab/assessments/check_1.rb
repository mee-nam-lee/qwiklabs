# method description
def check_1(handles:, maximum_score:, resources:)
  current_time_kst = Time.now.getlocal('+09:00')
  formatted_korean_time = current_time_kst.strftime("%Y-%m-%dT%H:%M:%S%:z")

  stringio = StringIO.new("#{maximum_score},#{formatted_korean_time}")
  storage = handles['project_0.StorageV1']

  project_id = resources['project_0']['project_id']
  desired_bucket = project_id + "-bucket"

  desired_object = "score/check_1.csv"
  ret_hash = { :score => 0, :message => "", :student_message => ""}

  gcs_file_object = storage.insert_object(desired_bucket,name:desired_object, upload_source: stringio, freeze_args:true)

  ret_hash = { :score => maximum_score, :message => "success" }
  return ret_hash
end
