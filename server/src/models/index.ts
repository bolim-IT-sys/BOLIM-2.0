import { User } from "./User";
import { Module } from "./Module";
import { UserModule } from "./UserModule";

User.belongsToMany(Module, {
  through: UserModule,
  foreignKey: "userId",
});

Module.belongsToMany(User, {
  through: UserModule,
  foreignKey: "moduleId",
});

export { User, Module, UserModule };
