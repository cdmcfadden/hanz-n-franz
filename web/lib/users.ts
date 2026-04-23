export type User = {
  id: string;
  name: string;
  shortName: string;
  avatar: string;
};

export const USERS: User[] = [
  {
    id: "david",
    name: "David (Hasselhoff)",
    shortName: "David",
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
