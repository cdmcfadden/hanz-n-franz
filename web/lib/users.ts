export type User = {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
};

export const USERS: User[] = [
  {
    id: "david",
    name: "Dave (Hasselhoff)",
    shortName: "Dave",
    avatar: "/users/david.jpg",
  },
  {
    id: "chris",
    name: "Chris (Hemsworth)",
    shortName: "Chris",
    avatar: "/users/chris.jpg",
  },
];

export const DEFAULT_USER_ID = "chris";
