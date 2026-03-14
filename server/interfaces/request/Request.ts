export interface RequestEntity {
  id: string;
  name: string;
  method: string;
  url: string;
  headers?: string;
  body?: string;
  params?: string;
  auth?: string;
  preRequestScript?: string;
  testScript?: string;
  folderId?: string;
  collectionId: string;
  createdAt?: string;
  updatedAt?: string;
}
