## Meta

_Metadata about the document and it's format_

| Name      | Type     | Required? | Comment                                                                         |
| --------- | -------- | --------- | ------------------------------------------------------------------------------- |
| origin    | string   | Yes       | Origin application/client e.g "grindery"                                        |
| format    | string   | Yes       | Format of document e.g "PaymentRequest" or "BatchPayment"                       |
| version   | string   | Yes       | Version of the document format used. Only "0.0.1" at the moment                 |
| updateOf  | string   | No        | CID/Hash of the document/record that this record/document replaces/supersedes   |