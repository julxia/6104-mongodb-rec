import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface UserDoc extends BaseDoc {
  username: string;
  password: string;
}

export default class UserConcept {
  public readonly users = new DocCollection<UserDoc>("users");

  async getById(_id: ObjectId) {
    // Hint: check out this.users.readOne
    const user = await this.users.readOne({ _id });
    return user;
  }

  async create(username: string, password: string) {
    await this.canCreate(username, password);
    const _id = await this.users.createOne({ username, password });
    return { msg: "User created successfully!", user: await this.users.readOne({ _id }) };
  }

  async update(_id: ObjectId, update: Partial<UserDoc>) {
    // Hint: check out this.users.updateOne
    await this.users.updateOne({ _id }, update);
    return { msg: "User updated successfully!", user: await this.users.readOne({ _id }) };
  }

  // Sanitizes user object by removing password field
  private sanitizeUser(user: UserDoc) {
    // eslint-disable-next-line
    const { password, ...rest } = user; // remove password
    return rest;
  }

  async getUsers(username?: string) {
    // If username is undefined, return all users by applying empty filter
    const filter = username ? { username } : {};
    const users = (await this.users.readMany(filter)).map(this.sanitizeUser);
    return users;
  }

  async authenticate(username: string, password: string) {
    const user = await this.users.readOne({ username, password });
    if (!user) {
      throw new NotAllowedError("Username or password is incorrect.");
    }
    return { msg: "Successfully authenticated.", _id: user._id };
  }

  private async canCreate(username: string, password: string) {
    if (!username || !password) {
      throw new BadValuesError("Username and password must be non-empty!");
    }
    await this.isUsernameUnique(username);
  }

  private async isUsernameUnique(username: string) {
    if (await this.users.readOne({ username })) {
      throw new NotAllowedError(`User with username ${username} already exists!`);
    }
  }
}
