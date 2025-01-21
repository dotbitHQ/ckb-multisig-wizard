
import fs from 'fs'
import * as ckbUtils from '@nervosnetwork/ckb-sdk-utils'
import fetch from 'node-fetch'

const CKB_NODE_BASE_URL = 'http://localhost:8114';

const CELL_MAP = {
  "contracts": [
    {
      "name": "apply-register-cell-type",
      "cell_type": "local_contract",
      "type_id": "0xc024b6efde8d49af665b3245223a8aa889e35ede15bc510392a7fea2dec0a758",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xf18c3eab9fd28adbb793c38be9a59864989c1f739c22d2b6dc3f4284f047a69d"
      }
    },
    {
      "name": "pre-account-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x18ab87147e8e81000ab1b9f319a5784d4c7b6c98a9cec97d738a5c11f69e7254",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xf6574955079797010689a22cd172ce55b52d2c34d1e9bc6596e97babc2906f7e"
      }
    },
    {
      "name": "account-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x4f170a048198408f4f4d36bdbcddcebe7a0ae85244d3ab08fd40a80cbfc70918",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x96dc231bbbee6aa474076468640f9e0ad27cf13b1343716a7ce04b116ea18ba8"
      }
    },
    {
      "name": "account-sale-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x80f520a379c41c019ab56afd426b536175bff9c574b17524da81d2d82f3fb737",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xb782d5f4e24603340997494871ba8f7d175e6920e63ead6b8137170b2e370469"
      }
    },
    {
      "name": "proposal-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x6127a41ad0549e8574a25b4d87a7414f1e20579306c943c53ffe7d03f3859bbe",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xd7b779b1b30f86a77db6b292c9492906f2437b7d88a8a5994e722619bb1d41c8"
      }
    },
    {
      "name": "always-success",
      "cell_type": "local_contract",
      "type_id": "0x303ead37be5eebfcf3504847155538cb623a26f237609df24bd296750c123078",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xca5016f232830f8a73e6827b5e1108aca68e7cf8baea4847ac40ef1da43c4c50"
      }
    },
    {
      "name": "config-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x903bff0221b72b2f5d549236b631234b294f10f53e6cc7328af07776e32a6640",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x3775c65aabe8b79980c4933dd2f4347fa5ef03611cef64328685618aa7535794"
      }
    },
    {
      "name": "income-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x6c1d69a358954fc471a2ffa82a98aed5a4912e6002a5e761524f2304ab53bf39",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x108fba6a9b9f2898b4cdf11383ba2a6ed3da951b458c48e5f5de0353bbca2d46"
      }
    },
    {
      "name": "balance-cell-type",
      "cell_type": "local_contract",
      "type_id": "0xebafc1ebe95b88cac426f984ed5fce998089ecad0cd2f8b17755c9de4cb02162",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xbdc8f42643ccad23e8df3d2e8dbdea9201812cd1b7f84c46e69b020529629822"
      }
    },
    {
      "name": "reverse-record-cell-type",
      "cell_type": "local_contract",
      "type_id": "0xebc9e13658f6df13593cf59b7e9cd159602b6c3c7d54b14dea43bae600ebae11",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x000f3e1a89d85d268ed6d36578d474ecf91d8809f4f696dd2e5b97fe67b84a2e"
      }
    },
    {
      "name": "reverse-record-root-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x5c34f5ce635b74e57f1a70825be75a26666e01196a1945342110d5e24668b3dd",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x3bd4491a15b3c84de133f4d619f5f7317fe7df7098a5c8dfd0ff073e448321a7"
      }
    },
    {
      "name": "offer-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x1100b00d25dd5f19318b9034a5e2439672e846021ad1ec0bcb19775320fd2f21",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x3ffc0f8b0ce4bc09f700ca84355a092447d79fc5224a6fbd64af95af840af91b"
      }
    },
    {
      "name": "sub-account-cell-type",
      "cell_type": "local_contract",
      "type_id": "0x63516de8bb518ed1225e3b63f138ccbe18e417932d240f1327c8e86ba327f4b4",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x97b19f14184f24d55b1247596a5d7637f133c7bb7735f0ae962dc709c5fc1e2e"
      }
    },
    {
      "name": "device-key-list-cell-type",
      "cell_type": "local_contract",
      "type_id": "0xe1a03a44d5705926c34bddd974cb0d3b06a56718db8a2c63d77e06a6385331c9",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x97e271bfd332cc2e68feb6a4fa21a1dc010c53011d02d9acdbfc4d417d8efadd"
      }
    },
    {
      "name": "dpoint-cell-type",
      "cell_type": "local_contract",
      "type_id": "0xbe1a129bb8092ea53a748fab00d2c12223533619458e01fd8eebb329b7f914d6",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x5aa67507980f2bfdef75bf4f14caf886202f044d84fb4300858c9c823e3bb651"
      }
    },
    {
      "name": "eip712-lib",
      "cell_type": "local_contract",
      "type_id": "0x8f8239829479227a9dd58cc73da377bfe0879589aeb269cdf6177093fdb36389",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xa71fc12ca4ce4127dc911dbe8006f1907c850957849e282ef1f26e3ee50ba7bf"
      }
    },
    {
      "name": "dispatch",
      "cell_type": "local_contract",
      "type_id": "0x9376c3b5811942960a846691e16e477cf43d7c7fa654067c9948dfcd09a32137",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xda22fd296682488687a6035b5fc97c269b72d7de128034389bd03041b40309c0"
      }
    },
    {
      "name": "ckb_sign.so",
      "cell_type": "local_contract",
      "type_id": "0xf7e5ee57bfc0a17d3796cdae5a5b07c590668777166499d56178d510e1344765",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x4eed7961fdeaa659aa9ff59a242a2bc40f63dc043c1eba44c207ee6e05e02e9f"
      }
    },
    {
      "name": "ckb_multi_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x144f1ba88ec1fd316a37b5498552efce3447be8b74300fb6b92ad0efcbe964bb",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xab8a94c35890712763c70130db080fbbb7fe99ec74e7c87e4fdd44f4a6155646"
      }
    },
    {
      "name": "ed25519_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x3000f8c98b8b020b8a0785320d24f73b3ba37fc1d4697c1a00fc8dda0bbc1cc7",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xac4689bcb177af6ff0fee8c0c3bf0d8803b263381a5d5b22f1ca1b687eb5eb4a"
      }
    },
    {
      "name": "tron_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x79e9a08713a6818f1fbabb05da5a048342781b34d80e7f64b758be581197bdd3",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xb29620c50fd4fde746eae4d27e40b42d0900d1718fbf25ecae704e6a693215db"
      }
    },
    {
      "name": "eth_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x6bbd5ca9bbdbe9a03f51329b2c6d06017ee2ae20546f724f70f79b8922a7d5b1",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x748005446caeda5b04e30bca42a65bb0b5275d2bd02694f08ecb8d3d07c41433"
      }
    },
    {
      "name": "doge_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x1d13b5f6956c55dc13e8fb58b8aa7be2db429078d131fc140ccf94132a302a57",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x2388d84e42714e51cbb1a60c4ab2df3321c632a204b7d963d7f9b89a50ceaa3c"
      }
    },
    {
      "name": "webauthn_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x23bb512344f12fac23353466d436d0021a0df82114bcbcf23b733e447bcde404",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x3dd5981ead36572330cc90b0bd4795062483392bfeea09f6ff8f02c830988998"
      }
    },
    {
      "name": "btc_sign.so",
      "cell_type": "local_contract",
      "type_id": "0x2439aa66113a6d9c8dee5884107ddf988f40dac97a6579c45dcc65b03cb02b1c",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0xbeeb821fccb98acb8713cd0702c2d74729909222608ee78be42c6a15c1eb2014"
      }
    },
    {
      "name": "sighash_all_group",
      "cell_type": "remote_contract",
      "dep_type": "dep_group",
      "type_id": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      "out_point": {
        "tx_hash": "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
        "index": "0x0"
      }
    },
    {
      "name": "multisig_all_group",
      "cell_type": "remote_contract",
      "dep_type": "dep_group",
      "type_id": "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      "out_point": {
        "tx_hash": "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
        "index": "0x1"
      }
    },
    {
      "name": "secp256k1_blake160_sighash_all",
      "cell_type": "remote_contract",
      "type_id": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
    },
    {
      "name": "secp256k1_blake160_multisig_all",
      "cell_type": "remote_contract",
      "type_id": "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8"
    },
    {
      "name": "secp256k1_data",
      "cell_type": "remote_contract",
      "out_point": {
        "tx_hash": "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
        "index": "0x3"
      }
    },
    {
      "name": "pw-lock",
      "cell_type": "remote_contract",
      "type_id": "0xbf43c3602455798c1a61a596e0d95278864c552fafe231c063b3fabf97a8febc"
    },
    {
      "name": "did-cell-type",
      "cell_type": "local_contract",
      "type_id": "0xcfba73b58b6f30e70caed8a999748781b164ef9a1e218424a6fb55ebf641cb33",
      "type_script": {
        "code_hash": "0x00000000000000000000000000000000000000000000000000545950455f4944",
        "hash_type": "type",
        "args": "0x62312cd846659e188b05da11dc3f080b083c27371ea701d6026e11e713e0e3de"
      }
    }
  ],
  "normal_cells": [
    {
      "name": "CellOfDas",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0x0000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "name": "ConfigCell",
      "type_id": "0x903bff0221b72b2f5d549236b631234b294f10f53e6cc7328af07776e32a6640"
    },
    {
      "name": "AccountCell",
      "type_id": "0x4f170a048198408f4f4d36bdbcddcebe7a0ae85244d3ab08fd40a80cbfc70918"
    },
    {
      "name": "DidCell",
      "type_id": "0xcfba73b58b6f30e70caed8a999748781b164ef9a1e218424a6fb55ebf641cb33"
    },
    {
      "name": "AccountSaleCell",
      "type_id": "0x80f520a379c41c019ab56afd426b536175bff9c574b17524da81d2d82f3fb737"
    },
    {
      "name": "ApplyRegisterCell",
      "type_id": "0xc024b6efde8d49af665b3245223a8aa889e35ede15bc510392a7fea2dec0a758"
    },
    {
      "name": "PreAccountCell",
      "type_id": "0x18ab87147e8e81000ab1b9f319a5784d4c7b6c98a9cec97d738a5c11f69e7254"
    },
    {
      "name": "ProposalCell",
      "type_id": "0x6127a41ad0549e8574a25b4d87a7414f1e20579306c943c53ffe7d03f3859bbe"
    },
    {
      "name": "IncomeCell",
      "type_id": "0x6c1d69a358954fc471a2ffa82a98aed5a4912e6002a5e761524f2304ab53bf39"
    },
    {
      "name": "BalanceCell",
      "type_id": "0xebafc1ebe95b88cac426f984ed5fce998089ecad0cd2f8b17755c9de4cb02162"
    },
    {
      "name": "DPointCell",
      "type_id": "0xbe1a129bb8092ea53a748fab00d2c12223533619458e01fd8eebb329b7f914d6"
    },
    {
      "name": "ReverseRecordCell",
      "type_id": "0xebc9e13658f6df13593cf59b7e9cd159602b6c3c7d54b14dea43bae600ebae11"
    },
    {
      "name": "ReverseRecordRootCell",
      "type_id": "0x5c34f5ce635b74e57f1a70825be75a26666e01196a1945342110d5e24668b3dd"
    },
    {
      "name": "OfferCell",
      "type_id": "0x1100b00d25dd5f19318b9034a5e2439672e846021ad1ec0bcb19775320fd2f21"
    },
    {
      "name": "SubAccountCell",
      "type_id": "0x63516de8bb518ed1225e3b63f138ccbe18e417932d240f1327c8e86ba327f4b4"
    },
    {
      "name": "ContractSourceCell",
      "type_id": "0x00000000000000000000000000000000000000000000000000545950455f4944"
    },
    {
      "name": "HeightIndexCell",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0xfed559f2f93e5e7958d8a62b0b148cb18bc484bf"
      },
      "type_script": {
        "code_hash": "0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43",
        "hash_type": "type",
        "args": "0x02"
      }
    },
    {
      "name": "TimeIndexCell",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0x2228dae340f587647362d31e3f04d7a51f8168dc"
      },
      "type_script": {
        "code_hash": "0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43",
        "hash_type": "type",
        "args": "0x01"
      }
    },
    {
      "name": "QuoteIndexCell",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0xc45a83ea851eae30307ff47918ca3d2dabca7e52"
      },
      "type_script": {
        "code_hash": "0x3a468d53352eb855521dabed0dc7036929bfe72766ad58f801edfbae564f7b43",
        "hash_type": "type",
        "args": "0x00"
      }
    },
    {
      "name": "HeightCell",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0xfed559f2f93e5e7958d8a62b0b148cb18bc484bf"
      },
      "type_script": {
        "code_hash": "0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79",
        "hash_type": "type",
        "args": "0x02"
      }
    },
    {
      "name": "TimeCell",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0x2228dae340f587647362d31e3f04d7a51f8168dc"
      },
      "type_script": {
        "code_hash": "0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79",
        "hash_type": "type",
        "args": "0x01"
      }
    },
    {
      "name": "QuoteCell",
      "lock_script": {
        "code_hash": "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        "hash_type": "type",
        "args": "0xc45a83ea851eae30307ff47918ca3d2dabca7e52"
      },
      "type_script": {
        "code_hash": "0x9e537bf5b8ec044ca3f53355e879f3fd8832217e4a9b41d9994cf0c547241a79",
        "hash_type": "type",
        "args": "0x00"
      }
    }
  ]
}

;(async () => {
  const { address } = parseArgs();

  const scriptMap = {};
  for (const contract of CELL_MAP.contracts) {
    if (contract.type_script) {
      scriptMap[contract.name] = contract.type_script;
    }
  }

  const typeIdMap = {};
  for (const cell of CELL_MAP.normal_cells) {
    if (cell.type_id) {
      typeIdMap[cell.name] = cell.type_id;
    }
  }

  const lock = ckbUtils.addressToScript(address);
  let totalCells = 0;
  let totalNormalCells = 0;
  let totalDataCells = 0;
  let totalUnkownCells = 0;
  let totalApplyCells = 0;
  let totalConfigCells = 0;
  let totalDidContractCells = 0;
  let totalDidOtherCells = 0;

  let nextCursor = null;
  while (true) {
    const { cursor, cells } = await getCells(lock, 'lock', nextCursor);

    for (const cell of cells) {
      let outPoint = `${cell.out_point.tx_hash}-${cell.out_point.index}`;

      totalCells++;
      if (cell.output.type !== null) {
        let name = isCellInScriptMap(cell, scriptMap);
        if (name) {
          console.log(`${outPoint}: did contract cell, name: ${name}`);
          totalDidContractCells++;
        } else {
          let name = isCellInTypeIdMap(cell, typeIdMap);
          if (name) {
            if (name === 'ConfigCell') {
              console.log(`${outPoint}: config cell, name: ${name}`);
              totalConfigCells++;
            } else if (name === 'ApplyRegisterCell') {
              console.log(`${outPoint}: apply cell, name: ${name}`);
              totalApplyCells++;
            } else {
              console.log(`${outPoint}: did normal cell, name: ${name}`);
              totalDidOtherCells++;
            }
          } else {
            console.log(`${outPoint}: unkown cell, type: ${cell.output.type.code_hash}`);
            totalUnkownCells++;
          }
        }
      } else if (cell.output_data !== null && cell.output_data !== '0x') {
        if (cell.output_data.length >= 66) {
          console.log(`${outPoint}: data cell, data: ${cell.output_data.slice(0, 66)}...`);
        } else {
          console.log(`${outPoint}: data cell, data: ${cell.output_data}`);
        }
        totalDataCells++;
      } else {
        // console.log(`${outPoint}: normal cell`);
        totalNormalCells++;
      }
    }

    if (cells.length === 100) {
      nextCursor = cursor;
    } else {
      break;
    }

    // break;
  }

  console.log(`Total Data Cells: ${totalDataCells}/${totalCells}`);
  console.log(`Total Normal Cells: ${totalNormalCells}/${totalCells}`);
  console.log(`Total Unkown Cells: ${totalUnkownCells}/${totalCells}`);
  console.log(`Total DID Contract Cells: ${totalDidContractCells}/${totalCells}`);
  console.log(`Total Apply Cells: ${totalApplyCells}/${totalCells}`);
  console.log(`Total Config Cells: ${totalConfigCells}/${totalCells}`);
  console.log(`Total DID Other Cells: ${totalDidOtherCells}/${totalCells}`);
  console.log(`Total Cells: ${totalCells}`);
})();

function parseArgs () {
  const args = process.argv.slice(2);
  const addressIndex = args.indexOf('--address') !== -1 ? args.indexOf('--address') : args.indexOf('-a');

  if (addressIndex === -1 || addressIndex + 1 >= args.length) {
    log('error', 'Usage: node script.js --address <address-to-scan>');
    process.exit(1);
  }

  const address = args[addressIndex + 1];

  return { address };
}

/**
 *
 * @param script
 * @param type 'type'|'lock'
 * @param filter
 */
export async function getCells (script, type, cursor) {
  const payload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'get_cells',
    params: [
      {
        script: {
          code_hash: script.codeHash,
          hash_type: script.hashType,
          args: script.args,
        },
        script_type: type,
        // filter: filter,
        with_data: true,
      },
      'asc',
      '0x64',
      cursor,
    ],
  }

  const body = JSON.stringify(payload, null, '  ')
  const res = await fetch(CKB_NODE_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  })
  const data = await res.json()

  if (data.error) {
    throw new Error(`get_cells response error.(code: ${data.error.code}, message: ${data.error.message})`)
  }

  return { cursor: data.result.last_cursor, cells: data.result.objects }
}

function log (level, message) {
  // console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, message }));
  console.log(message);
}

function isCellInScriptMap(cell, scriptMap) {
  let type = cell.output.type;
  for (const [name, script] of Object.entries(scriptMap)) {
    if (type.code_hash === script.code_hash && type.hash_type === script.hash_type && type.args === script.args) {
      return name;
    }
  }

  return false;
}

function isCellInTypeIdMap(cell, typeIdMap) {
  let type = cell.output.type;
  for (const [name, typeId] of Object.entries(typeIdMap)) {
    if (type.code_hash === typeId) {
      return name;
    }
  }

  return false;
}
