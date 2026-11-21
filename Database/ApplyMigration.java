import java.nio.file.*;
import java.sql.*;
/** Run a reviewed, forward-only SQL file using DB_USERNAME / DB_PASSWORD. */
class ApplyMigration {
 public static void main(String[] args) throws Exception {
  if (args.length != 1) throw new IllegalArgumentException("Pass one SQL migration file");
  String sql=Files.readString(Path.of(args[0])).replaceAll("(?m)^--.*$", "");
  if (sql.matches("(?is).*\\b(DROP\\s+(TABLE|DATABASE|SCHEMA)|DELETE\\s+FROM|TRUNCATE)\\b.*")) throw new IllegalArgumentException("Destructive SQL is not allowed");
  String url=System.getenv().getOrDefault("SPRING_DATASOURCE_URL", System.getenv().getOrDefault("DB_URL", "jdbc:mysql://127.0.0.1:3306/halmbook?connectTimeout=5000&socketTimeout=10000"));
  try(Connection db=DriverManager.getConnection(url,System.getenv().getOrDefault("DB_USERNAME","root"),System.getenv().getOrDefault("DB_PASSWORD",""))) {
   int statements=0;
   for(String statement:sql.split(";")) if(!statement.isBlank()) {
    try(Statement query=db.createStatement()){query.execute(statement.trim());statements++;}
   }
   System.out.println("Migration applied: " + Path.of(args[0]).getFileName() + " ("+statements+" statements)");
  }
 }
}
