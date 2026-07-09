import { User } from "./User";
import { Module } from "./Module";
import { UserModule } from "./UserModule";

User.belongsToMany(Module, {
  through: UserModule,
  foreignKey: "userId",
  as: "modules",
});

Module.belongsToMany(User, {
  through: UserModule,
  foreignKey: "moduleId",
  as: "users",
});
