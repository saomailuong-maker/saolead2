export function canAddToInbox(resultPlaceIds: string[], externalId: string, alreadyExists: boolean) {
  return resultPlaceIds.includes(externalId) && !alreadyExists;
}
