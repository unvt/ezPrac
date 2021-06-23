task :default do
  require 'json'
  sh "parse-hocon hocon/style.conf > htdocs/style.json"
  style = JSON.parse(File.read('htdocs/style.json'))
  File.write('htdocs/style.json', JSON.pretty_generate(style))
  sh "gl-style-validate htdocs/style.json"
end



